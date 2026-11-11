---
"@fasterfixes/mcp": minor
---

New `get_feedback` tool: takes a `feedback_id` and returns one feedback item in full as markdown, with its Screenshot as an image. When the feedback has a Recording, a Timeline section lists what the reviewer did before submitting, merged in time order with the console logs and network requests. `list_feedbacks` describes the Recording line each recorded item carries, and its workflow becomes list, get one in full with `get_feedback`, fix, update the status. The `GetFeedbackJsonResponse`, `FeedbackRecordingJson` and `RecordingStepJson` types match what the agent API returns for a single feedback.
