import { useCallback, useRef } from "react";

export type SoundCue =
  | "hover"
  | "confirm"
  | "charge"
  | "shoot"
  | "guard"
  | "target"
  | "damage"
  | "dodge"
  | "transition"
  | "winner";

export function useGameAudio(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);

  return useCallback(
    (cue: SoundCue) => {
      if (!enabled || typeof window === "undefined") return;
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;
      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      if (context.state === "suspended") void context.resume();
      const start = context.currentTime;

      const tone = (
        type: OscillatorType,
        frequency: number,
        endFrequency: number,
        duration: number,
        volume: number,
        delay = 0,
      ) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const cueStart = start + delay;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, cueStart);
        oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), cueStart + duration);
        gain.gain.setValueAtTime(0.0001, cueStart);
        gain.gain.exponentialRampToValueAtTime(volume, cueStart + Math.min(0.018, duration * 0.2));
        gain.gain.exponentialRampToValueAtTime(0.0001, cueStart + duration);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(cueStart);
        oscillator.stop(cueStart + duration);
      };

      const noise = (duration: number, volume: number, cutoff: number, delay = 0) => {
        const frameCount = Math.ceil(context.sampleRate * duration);
        const buffer = context.createBuffer(1, frameCount, context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let index = 0; index < frameCount; index += 1) data[index] = Math.random() * 2 - 1;
        const source = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();
        const cueStart = start + delay;
        source.buffer = buffer;
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(cutoff, cueStart);
        gain.gain.setValueAtTime(volume, cueStart);
        gain.gain.exponentialRampToValueAtTime(0.0001, cueStart + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        source.start(cueStart);
        source.stop(cueStart + duration);
      };

      switch (cue) {
        case "shoot":
          noise(0.16, 0.12, 1500);
          tone("sawtooth", 145, 38, 0.2, 0.11);
          tone("square", 72, 32, 0.13, 0.06, 0.018);
          tone("sine", 46, 30, 0.32, 0.07, 0.025);
          break;
        case "charge":
          tone("square", 150, 220, 0.09, 0.035);
          tone("square", 240, 360, 0.1, 0.04, 0.07);
          tone("sawtooth", 390, 760, 0.18, 0.045, 0.14);
          tone("sine", 90, 170, 0.28, 0.04, 0.1);
          break;
        case "guard":
          noise(0.1, 0.055, 4200);
          tone("triangle", 520, 150, 0.3, 0.065);
          tone("sine", 180, 92, 0.4, 0.07, 0.02);
          tone("square", 880, 420, 0.11, 0.025, 0.035);
          break;
        case "damage":
          noise(0.2, 0.1, 900);
          tone("sawtooth", 95, 28, 0.34, 0.105);
          tone("square", 55, 25, 0.2, 0.055, 0.03);
          break;
        case "dodge":
          tone("sine", 980, 190, 0.2, 0.045);
          tone("triangle", 1260, 340, 0.17, 0.03, 0.035);
          noise(0.12, 0.025, 6000, 0.02);
          break;
        case "target":
          tone("sine", 540, 720, 0.055, 0.032);
          tone("square", 780, 940, 0.045, 0.018, 0.055);
          break;
        case "confirm":
          tone("triangle", 310, 480, 0.075, 0.03);
          tone("sine", 520, 680, 0.09, 0.028, 0.05);
          break;
        case "transition":
          tone("sine", 120, 260, 0.3, 0.03);
          tone("triangle", 220, 410, 0.22, 0.02, 0.08);
          break;
        case "winner":
          tone("sine", 164, 328, 0.45, 0.04);
          tone("triangle", 246, 492, 0.45, 0.035, 0.12);
          tone("sine", 328, 656, 0.58, 0.038, 0.24);
          tone("sine", 492, 984, 0.7, 0.03, 0.36);
          break;
        case "hover":
          tone("sine", 260, 310, 0.03, 0.009);
          break;
      }
    },
    [enabled],
  );
}
