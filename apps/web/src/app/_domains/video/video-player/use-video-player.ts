import { useEffect, useRef, useState, type RefObject } from "react";
import { isPlayPauseShortcut } from "../_helpers/is-play-pause-shortcut";

/**
 * Transport state for one `<video>`, read through rAF while playing so the
 * playhead moves smoothly, not at the 4 Hz of `timeupdate`. The source is set
 * here rather than as a prop: a refreshed playback URL swaps it in place and
 * resumes at the same position, instead of restarting the Video.
 */
export function useVideoPlayer(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string,
  initialDurationMs: number | null,
  initialMs = 0,
) {
  const [currentMs, setCurrentMs] = useState(initialMs);
  const [durationMs, setDurationMs] = useState(initialDurationMs ?? 0);
  const [paused, setPaused] = useState(true);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const loadedSrcRef = useRef<string | null>(null);
  // Applies to the first source only; a refresh resumes where it was.
  const initialMsRef = useRef(initialMs);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadedSrcRef.current === src) return;

    const resumeAt = video.currentTime;
    const wasPlaying = !video.paused;
    const isRefresh = loadedSrcRef.current !== null;
    loadedSrcRef.current = src;
    video.src = src;
    if (!isRefresh) {
      // Before metadata loads this sets where playback starts.
      if (initialMsRef.current > 0) {
        video.currentTime = initialMsRef.current / 1000;
      }
      return;
    }

    const resume = () => {
      video.currentTime = resumeAt;
      if (wasPlaying) video.play().catch(() => undefined);
    };
    video.addEventListener("loadedmetadata", resume, { once: true });
    return () => video.removeEventListener("loadedmetadata", resume);
  }, [videoRef, src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frame = 0;
    const tick = () => {
      setCurrentMs(video.currentTime * 1000);
      if (!video.paused && !video.ended) frame = requestAnimationFrame(tick);
    };
    const handleLoaded = () => {
      if (Number.isFinite(video.duration)) setDurationMs(video.duration * 1000);
    };
    const handlePlay = () => {
      setPaused(false);
      frame = requestAnimationFrame(tick);
    };
    const handlePause = () => {
      setPaused(true);
      cancelAnimationFrame(frame);
      setCurrentMs(video.currentTime * 1000);
    };
    const handleSeeked = () => setCurrentMs(video.currentTime * 1000);

    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handlePause);
    video.addEventListener("seeked", handleSeeked);

    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handlePause);
      video.removeEventListener("seeked", handleSeeked);
    };
  }, [videoRef]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || !isPlayPauseShortcut(event)) return;
      // Also keeps Space from scrolling the page, clicking a focused button or
      // opening a focused menu trigger: Radix skips its handler once the
      // default is prevented.
      event.preventDefault();
      if (video.paused) video.play().catch(() => undefined);
      else video.pause();
    };
    // Capture runs before React's handlers, which sit on the root.
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [videoRef]);

  function seek(ms: number) {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, ms);
    video.currentTime = clamped / 1000;
    setCurrentMs(clamped);
  }

  function pause() {
    videoRef.current?.pause();
  }

  function setPlaybackRate(rate: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    // A refreshed source resets the rate to this default, so the speed survives.
    video.defaultPlaybackRate = rate;
    setPlaybackRateState(rate);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }

  return {
    currentMs,
    durationMs,
    paused,
    playbackRate,
    seek,
    pause,
    togglePlay,
    setPlaybackRate,
  };
}
