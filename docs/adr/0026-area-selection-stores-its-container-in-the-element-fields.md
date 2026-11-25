# ADR-0026: An area Selection stores its container in the element fields

- **Status**: Accepted
- **Date**: 2026-11-24

## Context

A page Selection gains a second form (issue #471): besides clicking an element, a Reviewer can drag a rectangle of the viewport, an **area Selection**. An area is about the rectangle, not about any element, yet its **Pin** must still follow the page through scroll, resize and layout changes, which the Widget only knows how to do by resolving an element from `selector` and `metadata.selectors` and placing the Pin at `metadata.pinAnchor` inside it. Widgets already installed on customer sites read the Feedback of newer Widgets, and `pin-placement.ts` states that the stored shape must stay identical across them.

## Decision

- **The container goes in the element fields.** An area Selection writes the selector of its container, the smallest element whose box contains the whole rectangle, to `selector` and `metadata.selectors`, and the rectangle's top-left corner inside that container to `metadata.pinAnchor` and `metadata.pinPlacement`, exactly as an element Selection does for the clicked element.
- **The form is told by the geometry.** `metadata.selection` carries `viewport` and `area` (left, top, width, height in viewport CSS pixels) for an area Selection, `viewport`, `element` and `click` for an element Selection. `clickX` and `clickY` stay empty for an area.
- **The container's context is kept, minus its text.** `elementDescription`, `reactComponentPath` and `sourceFile` describe the container; `nearbyText` is not captured.
- **One reader decides the label.** Every consumer (inbox, Tracker bodies, agent markdown, Recording timeline) reads a page Selection through a single helper that returns the element form or the area form, and labels the container "inside", never as the thing selected.
- **Trackers describe the area in text.** The Screenshot stays the full viewport and unframed; a framed copy for integrations is a separate effort that would serve both forms.
- **Agents read areas, they do not create them.** `create_feedbacks` and the Agent API keep their element-only input.

## Alternatives considered

1. **A dedicated container field, `selector` left empty.** Keeps `selector` meaning "the element selected" everywhere, but an installed Widget of an earlier version finds no element and falls back to a fixed document point, so the Pin drifts as soon as the layout changes.
2. **No container, the Pin placed by document coordinates.** The simplest shape, with the same drift for every Widget version, and nothing to tell an agent where in the code the area lives.
3. **The elements the rectangle overlaps.** Mostly noise: a layout gap overlaps several unrelated elements, none of which the Feedback is about.

## Consequences

- `selector` no longer always names the selected element. Code that reads it without going through the page Selection reader will mislabel a container as the Selection.
- A rectangle spanning unrelated parts of the page resolves to a high container, at worst `body`; its Pin then follows the document rather than a component, including when the area straddles a sticky or fixed element.
- An installed Widget of an earlier version shows the Pin of an area Feedback in the right place but cannot redraw the area on hover.
- An area is hard to read in a Tracker issue: pixels in text, an unframed Screenshot. The inbox link is where it shows.
