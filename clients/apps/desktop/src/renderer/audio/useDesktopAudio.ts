import { useCallback } from "react";

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
      // already stopped
    }
  }
  activeRingtoneOscillators = [];
}

export function useDesktopAudio() {
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
      // Audio restricted
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
      [783.99, 659.25, 523.25].forEach((freq, idx) => {
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

  const stopRingtones = useCallback(() => {
    clearCurrentRingtones();
  }, []);

  const startOutgoingRingtone = useCallback(() => {
    clearCurrentRingtones();
    const playRingCycle = () => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
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
    activeRingtoneTimer = window.setInterval(playIncomingCycle, 3500);
  }, []);

  const playCallConnected = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + i * 0.1 + 0.28,
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.3);
      });
    } catch {
      // Audio restricted
    }
  }, []);

  const playCallEnded = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(210, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } catch {
      // Audio restricted
    }
  }, []);

  return {
    playYahooChime,
    playBuzzSound,
    playMessageSound,
    playSentSound,
    playDoorOpen,
    playDoorSlam,
    startOutgoingRingtone,
    startIncomingRingtone,
    stopRingtones,
    playCallConnected,
    playCallEnded,
  };
}
