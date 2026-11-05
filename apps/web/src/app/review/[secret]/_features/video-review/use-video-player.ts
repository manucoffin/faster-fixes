import { useEffect, useRef, useState, type RefObject } from "react";

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
) {
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(initialDurationMs ?? 0);
  const [paused, setPaused] = useState(true);
  const loadedSrcRef = useRef<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || loadedSrcRef.current === src) return;

    const resumeAt = video.currentTime;
    const wasPlaying = !video.paused;
    const isRefresh = loadedSrcRef.current !== null;
    loadedSrcRef.current = src;
    video.src = src;
    if (!isRefresh) return;

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

  function seek(ms: number) {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, ms);
    video.currentTime = clamped / 1000;
    setCurrentMs(clamped);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => undefined);
    else video.pause();
  }

  return { currentMs, durationMs, paused, seek, togglePlay };
}
