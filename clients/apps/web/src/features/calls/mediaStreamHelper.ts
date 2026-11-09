/**
 * Media Stream Helper for Retro Messenger Voice & Video Calls
 * Supports real WebRTC navigator.mediaDevices.getUserMedia with seamless
 * fallback to authentic retro Yahoo! Messenger simulated webcam & audio.
 */

export interface MediaAcquisitionResult {
  stream: MediaStream;
  isSimulated: boolean;
  stop: () => void;
}

/**
 * Creates an authentic retro Yahoo! Messenger simulated webcam stream
 * using an animated offscreen canvas (320x240 @ 15fps).
 */
export function createRetroSimulatedVideoStream(
  title: string,
  subtitle?: string,
): { stream: MediaStream; stop: () => void } {
  if (typeof document === "undefined") {
    const dummyStream =
      typeof MediaStream !== "undefined"
        ? new MediaStream()
        : ({
            getTracks: () => [],
            getVideoTracks: () => [],
            getAudioTracks: () => [],
            addTrack: () => {},
          } as unknown as MediaStream);
    return { stream: dummyStream, stop: () => {} };
  }

  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 240;
  const ctx = canvas.getContext("2d");

  let animationFrameId: number | null = null;
  let frameCount = 0;

  // SMPTE-style retro TV color bar palette
  const colorBars = [
    "#c0c0c0", // Gray/White
    "#c0c000", // Yellow
    "#00c0c0", // Cyan
    "#00c000", // Green
    "#c000c0", // Magenta
    "#c00000", // Red
    "#0000c0", // Blue
  ];

  const renderFrame = () => {
    if (!ctx) return;
    frameCount++;

    // 1. Dark Purple Retro Background
    ctx.fillStyle = "#1e0b36";
    ctx.fillRect(0, 0, 320, 240);

    // 2. Retro TV color bars at the top (height 28px)
    const barWidth = 320 / colorBars.length;
    colorBars.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, 0, barWidth + 1, 28);
    });

    // 3. CRT Scanline subtle pattern in middle
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let y = 30; y < 210; y += 4) {
      ctx.fillRect(0, y, 320, 2);
    }

    // 4. Centered Retro Webcam Avatar / Icon
    const centerX = 160;
    const centerY = 110;
    const pulse = Math.sin(frameCount * 0.1) * 3;

    // Outer glow circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38 + pulse, 0, Math.PI * 2);
    ctx.fillStyle = "#3c1868";
    ctx.fill();
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Retro Smiley Face
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = "#ffcc00";
    ctx.fill();
    ctx.strokeStyle = "#d4a000";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "#331100";
    ctx.beginPath();
    ctx.arc(centerX - 10, centerY - 6, 3.5, 0, Math.PI * 2);
    ctx.arc(centerX + 10, centerY - 6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Smile
    ctx.beginPath();
    ctx.arc(centerX, centerY + 2, 16, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#331100";
    ctx.stroke();

    // 5. Title & Info text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px 'Tahoma', 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(title, 160, 170);

    ctx.fillStyle = "#ffd700";
    ctx.font = "10px 'Tahoma', 'Segoe UI', sans-serif";
    ctx.fillText(subtitle || "Yahoo! Messenger Video Stream", 160, 186);

    // 6. Bottom Status Bar with Real Clock & LIVE indicator
    ctx.fillStyle = "#0d0417";
    ctx.fillRect(0, 214, 320, 26);

    // Blinking REC dot
    const isBlinkOn = Math.floor(frameCount / 15) % 2 === 0;
    ctx.beginPath();
    ctx.arc(16, 227, 4, 0, Math.PI * 2);
    ctx.fillStyle = isBlinkOn ? "#ff3333" : "#661111";
    ctx.fill();

    ctx.fillStyle = "#e0d0f0";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("LIVE  320x240 @ 15fps", 26, 230);

    const timeStr = new Date().toLocaleTimeString("en-GB");
    ctx.textAlign = "right";
    ctx.fillText(timeStr, 310, 230);
  };

  const timer = window.setInterval(renderFrame, 66); // ~15 FPS
  renderFrame();

  const canvasStream = (
    canvas as HTMLCanvasElement & {
      captureStream: (fps?: number) => MediaStream;
    }
  ).captureStream(15);

  const stop = () => {
    if (timer !== null) {
      window.clearInterval(timer);
    }
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
    }
    canvasStream.getTracks().forEach((track) => track.stop());
  };

  return { stream: canvasStream, stop };
}

/**
 * Creates a simulated audio track using Web Audio API
 * so audio visualizers and tracks work even without physical microphone.
 */
export function createSimulatedAudioTrack(): {
  track: MediaStreamTrack;
  stop: () => void;
} {
  let audioCtx: AudioContext | null = null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new AudioContextClass();
  } catch {
    // audio context unsupported
  }

  if (!audioCtx) {
    if (typeof document === "undefined") {
      return {
        track: { stop: () => {} } as unknown as MediaStreamTrack,
        stop: () => {},
      };
    }
    // Return empty silent dummy track
    const canvas = document.createElement("canvas");
    const stream = (
      canvas as HTMLCanvasElement & {
        captureStream: () => MediaStream;
      }
    ).captureStream();
    return {
      track: stream.getVideoTracks()[0] as unknown as MediaStreamTrack,
      stop: () => {},
    };
  }

  const dest = audioCtx.createMediaStreamDestination();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(220, audioCtx.currentTime);
  // Gentle simulated carrier signal
  gain.gain.setValueAtTime(0.005, audioCtx.currentTime);

  osc.connect(gain);
  gain.connect(dest);
  osc.start();

  const audioTrack = dest.stream.getAudioTracks()[0]!;

  const stop = () => {
    try {
      osc.stop();
      osc.disconnect();
      gain.disconnect();
      audioTrack.stop();
      if (audioCtx && audioCtx.state !== "closed") {
        void audioCtx.close();
      }
    } catch {
      // already stopped
    }
  };

  return { track: audioTrack, stop };
}

/**
 * Safely acquires user media with transparent fallback to simulated
 * retro video & audio streams.
 */
export async function acquireUserMedia(options: {
  audio: boolean;
  video: boolean;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
}): Promise<MediaAcquisitionResult> {
  const cleanups: (() => void)[] = [];

  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"
    ) {
      const constraints: MediaStreamConstraints = {
        audio: options.audio,
        video: options.video
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24 },
            }
          : false,
      };

      const realStream = await navigator.mediaDevices.getUserMedia(constraints);
      return {
        stream: realStream,
        isSimulated: false,
        stop: () => {
          realStream.getTracks().forEach((track) => track.stop());
        },
      };
    }
  } catch {
    // Fall back to simulation if hardware is missing, in VM/headless, or permission denied
  }

  // Construct simulated stream
  const simStream =
    typeof MediaStream !== "undefined"
      ? new MediaStream()
      : ({
          getTracks: () => [],
          getVideoTracks: () => [],
          getAudioTracks: () => [],
          addTrack: () => {},
        } as unknown as MediaStream);

  if (options.video) {
    const videoSim = createRetroSimulatedVideoStream(
      options.fallbackTitle || "Yahoo! Webcam (Simulated)",
      options.fallbackSubtitle || "Camera not detected / Preview mode",
    );
    if (typeof videoSim.stream?.getVideoTracks === "function") {
      videoSim.stream.getVideoTracks().forEach((vt) => {
        if (typeof simStream.addTrack === "function") {
          simStream.addTrack(vt);
        }
      });
    }
    cleanups.push(videoSim.stop);
  }

  if (options.audio) {
    const audioSim = createSimulatedAudioTrack();
    if (audioSim.track && typeof simStream.addTrack === "function") {
      simStream.addTrack(audioSim.track);
    }
    cleanups.push(audioSim.stop);
  }

  return {
    stream: simStream,
    isSimulated: true,
    stop: () => {
      cleanups.forEach((fn) => fn());
      simStream.getTracks().forEach((t) => t.stop());
    },
  };
}

/**
 * Attaches a Web Audio AnalyserNode to a media stream
 * and samples the RMS volume level (0 to 100) at 100ms intervals.
 */
export function createAudioLevelMeter(
  stream: MediaStream,
  onLevelChange: (level: number) => void,
): () => void {
  if (!stream || typeof stream.getAudioTracks !== "function") {
    return () => {};
  }
  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    return () => {};
  }

  let audioCtx: AudioContext | null = null;
  let intervalId: number | null = null;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return () => {};

    audioCtx = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    intervalId = window.setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]!;
      }
      const average = sum / dataArray.length;
      // Normalize to 0 - 100 with sensitivity boost
      const level = Math.min(100, Math.round((average / 128) * 100));
      onLevelChange(level);
    }, 100);
  } catch {
    return () => {};
  }

  return () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
    }
    if (audioCtx && audioCtx.state !== "closed") {
      try {
        void audioCtx.close();
      } catch {
        // ignore
      }
    }
  };
}
