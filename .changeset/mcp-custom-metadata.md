---
"@fasterfixes/mcp": patch
---

`list_feedbacks` tool: the description now states that each Feedback carries the Custom metadata the site attached, next to the captured console logs and network requests. The `FeedbackJson` type gains `customMetadata`, `metadata` and `diagnosticTrail` so it matches what the agent API returns. No behavioral change.
