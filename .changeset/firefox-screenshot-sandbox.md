---
"@fasterfixes/widget": patch
---

Attach a Screenshot to Feedback submitted from Firefox. On Firefox 156 and later every capture failed with `can't access property "appendChild", l.body is null`, because the capture library wrote into its sandbox iframe before the iframe's document had loaded. The Widget now creates that iframe itself, waits for it to load, excludes it from the image and removes it after every capture, whether the capture succeeded or failed, so no hidden iframe is left in your page.
