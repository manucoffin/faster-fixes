"use client";

// PROTOTYPE, throwaway. A clock standing in for the replayer and the audio.
import { useCallback, useEffect, useRef, useState } from "react";
import { DURATION_MS, silenceJump } from "./data";

export type Playback = ReturnType<typeof useFakePlayback>;

export function useFakePlayback(speeds: readonly number[]) {
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(speeds[0] ?? 1);
  const [isSkippingSilence, setIsSkippingSilence] = useState(false);
  const timeRef = useRef(0);

  const seek = useCallback((next: number) => {
    const clamped = Math.min(DURATION_MS, Math.max(0, next));
    timeRef.current = clamped;
    setTime(clamped);
  }, []);

  const toggle = useCallback(() => {
    if (timeRef.current >= DURATION_MS) seek(0);
    setIsPlaying((current) => !current);
  }, [seek]);

  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      let next = timeRef.current + (now - last) * speed;
      last = now;
      if (isSkippingSilence) next = silenceJump(next) ?? next;
      if (next >= DURATION_MS) {
        next = DURATION_MS;
        setIsPlaying(false);
      }
      timeRef.current = next;
      setTime(next);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, speed, isSkippingSilence]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, button, [contenteditable]")) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return {
    time,
    isPlaying,
    speed,
    speeds,
    isSkippingSilence,
    seek,
    toggle,
    setSpeed,
    setIsSkippingSilence,
  };
}
