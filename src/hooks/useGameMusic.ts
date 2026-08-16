import { useCallback, useEffect, useRef } from "react";

export function useGameMusic(enabled: boolean, volume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/audio/deadlock-theme.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = enabled ? volume : 0;
    if (!enabled) audio.pause();
    if (enabled && unlockedRef.current) void audio.play().catch(() => undefined);
  }, [enabled, volume]);

  return useCallback(() => {
    unlockedRef.current = true;
    const audio = audioRef.current;
    if (!audio || !enabled) return;
    audio.volume = volume;
    void audio.play().catch(() => undefined);
  }, [enabled, volume]);
}
