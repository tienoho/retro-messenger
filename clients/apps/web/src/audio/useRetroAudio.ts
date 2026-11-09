import { useCallback, useRef, useEffect } from "react";

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    return AudioContextClass ? new AudioContextClass() : null;
  } catch {
    return null;
  }
}

// Module-level tracking for active ringing tones
let activeRingtoneTimer: number | null = null;
let activeRingtoneOscillators: OscillatorNode[] = [];

function clearCurrentRingtones() {
  if (activeRingtoneTimer !== null) {
    window.clearInterval(activeRingtoneTimer);
    activeRingtoneTimer = null;
  }
  for (const osc of activeRingtoneOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {
      // already stopped or disconnected
    }
  }
  activeRingtoneOscillators = [];
}

export function useRetroAudio() {
  const playYahooChime = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const notes = [587.33, 783.99, 987.77, 1174.66];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.1 + 0.35,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.38);
      });
    } catch {
      // Audio restricted or uninitialized
    }
  }, []);

  const playBuzzSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio restricted
    }
  }, []);

  const playMessageSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio restricted
    }
  }, []);

  const playSentSound = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {
      // Audio restricted
    }
  }, []);

  const playDoorOpen = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Classic door open: two knocks then ascending cheerful tone
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.09);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.09 + 0.25,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.09);
        osc.stop(ctx.currentTime + idx * 0.09 + 0.28);
      });
    } catch {
      // Audio restricted
    }
  }, []);

  const playDoorSlam = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Classic door slam: descending tone
      [659.25, 440.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.12 + 0.25,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.28);
      });
    } catch {
      // Audio restricted
    }
  }, []);

  const playAudibleSound = useCallback(
    (type: "hey" | "buzz" | "missyou" | "woohoo" | "byebye" | "laugh") => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        switch (type) {
          case "buzz": {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(200, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.45, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
            break;
          }
          case "hey": {
            // Cheerful trumpet "Hey!" (C5 -> E5 -> G5)
            [523.25, 659.25, 783.99].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "square";
              osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
              gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.08);
              gain.gain.exponentialRampToValueAtTime(
                0.01,
                ctx.currentTime + i * 0.08 + 0.18,
              );
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + i * 0.08);
              osc.stop(ctx.currentTime + i * 0.08 + 0.2);
            });
            break;
          }
          case "missyou": {
            // Gentle romantic melody (A4 -> C#5 -> E5 -> G#5)
            [440, 554.37, 659.25, 830.61].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13);
              gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.13);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + i * 0.13 + 0.35,
              );
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + i * 0.13);
              osc.stop(ctx.currentTime + i * 0.13 + 0.38);
            });
            break;
          }
          case "woohoo": {
            // Fanfare celebration (G4 -> C5 -> E5 -> G5 high fanfare)
            [392.0, 523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "triangle";
              osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
              gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.09);
              gain.gain.exponentialRampToValueAtTime(
                0.01,
                ctx.currentTime + i * 0.09 + 0.25,
              );
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + i * 0.09);
              osc.stop(ctx.currentTime + i * 0.09 + 0.28);
            });
            break;
          }
          case "laugh": {
            // Staccato chuckle (bounce between G5 and E5)
            [783.99, 659.25, 783.99, 659.25, 783.99].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sawtooth";
              osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
              gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.07);
              gain.gain.exponentialRampToValueAtTime(
                0.01,
                ctx.currentTime + i * 0.07 + 0.06,
              );
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + i * 0.07);
              osc.stop(ctx.currentTime + i * 0.07 + 0.07);
            });
            break;
          }
          case "byebye": {
            // Wave bye tone (G5 -> E5 -> C5)
            [783.99, 659.25, 523.25].forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
              gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                ctx.currentTime + i * 0.12 + 0.3,
              );
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(ctx.currentTime + i * 0.12);
              osc.stop(ctx.currentTime + i * 0.12 + 0.32);
            });
            break;
          }
        }
      } catch {
        // Audio restricted
      }
    },
    [],
  );

  const stopRingtones = useCallback(() => {
    clearCurrentRingtones();
  }, []);

  const startOutgoingRingtone = useCallback(() => {
    clearCurrentRingtones();
    const playRingCycle = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        // Dual-tone telephone ringback (440Hz + 480Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, ctx.currentTime);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + 1.6);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc2.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 1.85);
        osc2.stop(ctx.currentTime + 1.85);

        activeRingtoneOscillators = [osc1, osc2];
      } catch {
        // Audio restricted
      }
    };

    playRingCycle();
    activeRingtoneTimer = window.setInterval(playRingCycle, 4000);
  }, []);

  const startIncomingRingtone = useCallback(() => {
    clearCurrentRingtones();
    const playIncomingCycle = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        // Classic Yahoo! incoming call chime melody (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
        const newOscs: OscillatorNode[] = [];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
          gain.gain.setValueAtTime(0.14, ctx.currentTime + i * 0.12);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + i * 0.12 + 0.35,
          );
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + i * 0.12);
          osc.stop(ctx.currentTime + i * 0.12 + 0.38);
          newOscs.push(osc);
        });
        activeRingtoneOscillators = newOscs;
      } catch {
        // Audio restricted
      }
    };

    playIncomingCycle();
    activeRingtoneTimer = window.setInterval(playIncomingCycle, 2800);
  }, []);

  const playCallConnected = useCallback(() => {
    clearCurrentRingtones();
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Upbeat confirmation double chime (D5 -> A5)
      [587.33, 880.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.1 + 0.22,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.25);
      });
    } catch {
      // Audio restricted
    }
  }, []);

  const playCallEnded = useCallback(() => {
    clearCurrentRingtones();
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Descending hangup tones (A4 -> A3)
      [440.0, 220.0].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.12 + 0.22,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.25);
      });
    } catch {
      // Audio restricted
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCurrentRingtones();
    };
  }, []);

  return {
    playYahooChime,
    playBuzzSound,
    playMessageSound,
    playSentSound,
    playDoorOpen,
    playDoorSlam,
    playAudibleSound,
    startOutgoingRingtone,
    startIncomingRingtone,
    stopRingtones,
    playCallConnected,
    playCallEnded,
  };
}
