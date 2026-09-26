---
"@fasterfixes/widget": major
---

First release. `@fasterfixes/widget` installs the FasterFixes Widget on any website with no framework and no build step: paste one `<script>` tag pointing at `https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js` with `data-project-id`, and optionally `data-color`, `data-position`, `data-api-origin` and `data-capture-diagnostics`. Leave out `data-project-id` to call `window.FasterFixes.init(options)` yourself with the full option object, including `labels`. With a bundler, `import { init } from "@fasterfixes/widget"`. The instance exposes `show()`, `hide()`, `isVisible`, `startAnnotation()`, `feedbackItems`, `togglePins()`, `showPins` and `destroy()`, matching `useFeedback` in `@fasterfixes/react`. The Widget renders inside a Shadow DOM, is themed with `--ff-*` CSS custom properties and `::part()`, and ships no framework runtime. The version starts at 1.0.0 so the `@1` CDN channel never has to change.
