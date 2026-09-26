---
"@fasterfixes/widget": minor
---

Add `subscribe(listener)` to the Widget instance returned by `init` and by `createWidget` from `@fasterfixes/widget/internal`. The listener is called after `isVisible`, `feedbackItems` or `showPins` changes, and not when a value is set to what it already was. `subscribe` returns a function that removes the listener, and `destroy()` removes every listener. Use it to keep your own UI in sync with the Widget without polling.
