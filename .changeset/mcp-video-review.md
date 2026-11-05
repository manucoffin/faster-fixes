---
"@fasterfixes/mcp": minor
---

New `list_videos` tool: lists the project's videos that are ready for review, with their id, title, filename, duration, pixel size and open feedback count. `list_feedbacks` accepts `video_id` to list one video's feedback; it cannot be combined with `page_url`. The `FeedbackJson` type gains `videoId` and `selection`, `pageUrl` becomes nullable, and `ListFeedbacksJsonResponse` gains the optional `video` block, matching what the agent API returns.
