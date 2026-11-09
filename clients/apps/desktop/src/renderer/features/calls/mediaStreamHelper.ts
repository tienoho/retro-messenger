/**
 * Media Stream Helper for Desktop Retro Messenger Voice & Video Calls
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
    ctx.arc(centerX, centerY + 4, 16, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.strokeStyle = "#331100";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 5. Retro Banner / Text Badges
    ctx.fillStyle = "#ffdd00";
    ctx.font = "bold 13px 'Trebuchet MS', Tahoma, sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(title, centerX, 175);

    if (subtitle) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px 'Trebuchet MS', Tahoma, sans-serif";
      ctx.fillText(subtitle, centerX, 195);
    }

    // 6. Super Video & Live Indicator at bottom
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 215, 320, 25);

    // Blinking REC / LIVE indicator
    const blink = Math.floor(frameCount / 15) % 2 === 0;
    ctx.fillStyle = blink ? "#ef4444" : "#7f1d1d";
    ctx.beginPath();
    ctx.arc(18, 227, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "9px 'Courier New', monospace";
    ctx.textAlign = "left";
    ctx.shadowBlur = 0;
    ctx.fillText("LIVE - SUPER VIDEO 320x240", 28, 230);

    // FPS badge
    ctx.textAlign = "right";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("15 FPS", 312, 230);

    animationFrameId = requestAnimationFrame(renderFrame);
  };

  renderFrame();

  // Capture stream from canvas at 15fps (authentic retro webcam rate)
  const stream =
    typeof canvas.captureStream === "function"
      ? canvas.captureStream(15)
      : new MediaStream();

  const stop = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    stream.getTracks().forEach((track) => track.stop());
  };

  return { stream, stop };
}

/**
 * Creates a simulated quiet audio track using Web Audio API oscillator
 * so WebRTC transceivers have valid audio to negotiate even without physical mic.
 */
export function createSimulatedAudioTrack(): {
  track: MediaStreamTrack | null;
  stop: () => void;
} {
  try {
    const AudioContextClass =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        : null;

    if (!AudioContextClass) {
      return { track: null, stop: () => {} };
    }

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const dst = ctx.createMediaStreamDestination();

    // Inaudible ambient carrier (subtle 20Hz hum at near-zero volume)
    osc.frequency.setValueAtTime(20, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);

    osc.connect(gain);
    gain.connect(dst);
    osc.start();

    const track = dst.stream.getAudioTracks()[0] ?? null;

    return {
      track,
      stop: () => {
        try {
          osc.stop();
          void ctx.close();
        } catch {
          // ignore
        }
      },
    };
  } catch {
    return { track: null, stop: () => {} };
  }
}

/**
 * Acquires user media (microphone and/or webcam) with automatic fallback
 * to retro simulated canvas stream if camera/mic is denied or unavailable.
 */
export async function acquireUserMedia(options: {
  video: boolean;
  audio: boolean;
  fallbackTitle: string;
}): Promise<MediaAcquisitionResult> {
  const cleanups: (() => void)[] = [];

  // 1. Try real hardware first
  if (
    typeof navigator !== "undefined" &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  ) {
    try {
      const realStream = await navigator.mediaDevices.getUserMedia({
        video: options.video
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24 },
            }
          : false,
        audio: options.audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
            }
          : false,
      });

      return {
        stream: realStream,
        isSimulated: false,
        stop: () => {
          realStream.getTracks().forEach((t) => t.stop());
        },
      };
    } catch {
      // Hardware camera/mic not available, permissions denied, or headless/VM environment.
      // Fall through to retro simulation.
    }
  }

  // 2. Fallback to retro simulation
  const simStream = new MediaStream();

  if (options.video) {
    const videoSim = createRetroSimulatedVideoStream(
      options.fallbackTitle,
      "Retro Webcam (Hardware Fallback)",
    );
    const videoTracks = videoSim.stream.getVideoTracks();
    if (videoTracks[0] && typeof simStream.addTrack === "function") {
      simStream.addTrack(videoTracks[0]);
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

