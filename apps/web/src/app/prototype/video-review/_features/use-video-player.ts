import { useEffect, useState, type RefObject } from "react";

// Transport state for one <video>, read through rAF while playing so the
// playhead and the pins move smoothly, not at the 4 Hz of `timeupdate`.
export function useVideoPlayer(videoRef: RefObject<HTMLVideoElement | null>) {
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [paused, setPaused] = useState(true);
  const [frameSize, setFrameSize] = useState({ width: 16, height: 9 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frame = 0;
    const tick = () => {
      setCurrentMs(video.currentTime * 1000);
      if (!video.paused && !video.ended) frame = requestAnimationFrame(tick);
    };
    const handleLoaded = () => {
      setDurationMs(video.duration * 1000);
      setFrameSize({ width: video.videoWidth, height: video.videoHeight });
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
    // Metadata may already be in when the effect attaches, after a remount.
    const pending = video.readyState >= 1 ? setTimeout(handleLoaded, 0) : null;

    return () => {
      if (pending !== null) clearTimeout(pending);
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
    video.currentTime = Math.max(0, ms) / 1000;
    setCurrentMs(Math.max(0, ms));
  }

  function pause() {
    videoRef.current?.pause();
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  return {
    currentMs,
    durationMs,
    paused,
    frameSize,
    seek,
    pause,
    togglePlay,
  };
}

export type VideoPlayer = ReturnType<typeof useVideoPlayer>;
