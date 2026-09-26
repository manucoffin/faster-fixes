---
"@fasterfixes/core": patch
"@fasterfixes/react": patch
---

Internal typing cleanup: null checks, fallbacks and non-null assertions now match the real types. No public API change. A feedback status the widget does not know still renders with the `new` color, and an invalid `position` still falls back to `bottom-right`.
