---
"@fasterfixes/core": minor
---

`DEFAULT_LABELS` gains the strings the widget used to hard-code: `startFeedback`, `exitFeedbackMode`, `showFeedbackList`, `hideFeedbackList`, `showMarkers`, `hideMarkers`, `brandingLink` (the product link in the Feedback list footer), and `pinAriaLabel`, a function that receives the Feedback comment excerpt and returns the pin's accessible name. `Labels` is now an explicit interface whose text keys are typed `string`, so a `Partial<Labels>` accepts any custom wording. No key was removed or renamed.
