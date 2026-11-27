---
"@fasterfixes/core": patch
---

Report the right operating system for phones and tablets. `getBrowserInfo` returned `Linux` for Android devices and `macOS` for iPhones and iPads, so every Feedback sent from them showed the wrong `os`. Android now reports `Android`, and iPhone, iPod touch and iPad report `iOS`, including an iPad in desktop mode, which sends a Mac user agent and is told apart by its touchscreen. Desktop values are unchanged.
