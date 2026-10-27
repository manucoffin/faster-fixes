---
"@fasterfixes/widget": patch
---

Attach a Screenshot shortly after submit on pages with lazy images, unplayed videos or many web fonts. The capture no longer waits 30 seconds for media below the fold: images and videos get 3 seconds to load, then each remote asset gets 15 seconds to embed. Videos without a decoded frame are left out of the image instead of hanging the capture, and only the woff2 source of each `@font-face` is embedded, which kept font-heavy pages from rendering blank. The full capture now gets 15 seconds before the fallback replaces it, up from 3. The fallback keeps every element on the page, skips font embedding and draws slow images as same-size placeholders, so its image shows the same layout as the page instead of one with images and videos removed. On very large Retina viewports the capture scale is lowered to keep the canvas under 16 million pixels, so Safari returns an image instead of nothing.
