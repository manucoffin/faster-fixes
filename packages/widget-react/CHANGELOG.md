# Changelog

## 0.0.3

### Added
- Vertical toolbar with smooth expand/collapse animations
- Show/hide feedback pins toggle
- Feedback list toggle with slide-in/out animations
- Dark mode UI theme
- Element highlighting on pin hover and active feedback
- Cross-page feedback list with navigation
- Pending feedback deep linking via sessionStorage
- SPA navigation detection (URL change polling + popstate)
- Close-on-outside-click for pin popover
- Smart pin positioning (flips when near viewport edges)
- `middle-right` and `middle-left` widget positions
- Fade-out animation on successful feedback submission

### Fixed
- Screenshot capture failing with modern CSS color functions (switched to html2canvas-pro)
- Screenshot race condition where blob wasn't ready at submit time
- Widget buttons unclickable during feedback mode
- Dialogs/drawers closing when interacting with the widget
- Pins appearing at wrong position on page reload
- Pin popover retaining stale state (delete/edit) across different feedback items
- Popovers appearing behind the toolbar
- Z-index issues with host page modals and drawers

## 0.0.2

### Added
- Annotation overlay with element highlighting
- Comment popover with submit/cancel/retry states
- Feedback pins with status colors
- Pin popover for viewing, editing, and deleting feedback
- Collapsible feedback list with resolved filter
- Screenshot capture via html2canvas
- Floating UI positioning for popovers
- Configurable position, color, class names, and labels

## 0.0.1

### Added
- `FeedbackProvider` component
- `useFeedback` hook for programmatic control
- Basic floating button with annotation mode
