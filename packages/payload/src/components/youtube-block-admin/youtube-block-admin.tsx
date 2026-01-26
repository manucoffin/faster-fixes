"use client";

import { useState } from "react";
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
} from "../../blocks/utils/youtube";

export const YouTubeBlockAdmin = () => {
  const [videoURL, setVideoURL] = useState("");
  const [title, setTitle] = useState("");

  const videoId = videoURL ? extractYouTubeVideoId(videoURL) : null;
  const thumbnailUrl = videoId
    ? getYouTubeThumbnailUrl(videoId, "maxresdefault")
    : null;

  return (
    <div style={{ padding: "16px" }}>
      {/* URL Input */}
      <div style={{ marginBottom: "12px" }}>
        <label
          style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
        >
          YouTube URL
        </label>
        <input
          type="text"
          value={videoURL}
          onChange={(e) => setVideoURL(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Title Input */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{ display: "block", marginBottom: "4px", fontWeight: "500" }}
        >
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Video title..."
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
      </div>

      {/* Video Preview */}
      {videoId && thumbnailUrl && (
        <div>
          <img
            src={thumbnailUrl}
            alt={title || "YouTube Video"}
            style={{
              width: "100%",
              maxWidth: "480px",
              height: "auto",
              borderRadius: "8px",
            }}
          />
        </div>
      )}
    </div>
  );
};
