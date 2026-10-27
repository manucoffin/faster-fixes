---
"@fasterfixes/core": minor
"@fasterfixes/widget": patch
---

Record where the Selection sat on screen when the Reviewer made it. Each Feedback now carries a `selection` object in its metadata, measured in the same tick the Screenshot capture starts: the viewport size, the selected element's rectangle and the click point, all in viewport CSS pixels. The inbox uses it to draw the Selection frame over the Screenshot. `@fasterfixes/core` exports its shape as the `SelectionGeometry` type. No option, attribute or API contract changes.
