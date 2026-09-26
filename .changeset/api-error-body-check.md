---
"@fasterfixes/core": patch
---

`ApiError`: an error response whose body is not JSON, is `null`, or carries a non-string `error` now yields `"Request failed"` as the message instead of throwing a `TypeError` or passing the raw value through. Well-formed error responses are unchanged.
