---
"@fasterfixes/react": patch
---

Internal cleanup for the React Compiler lint rules: popovers, pins and the feedback list no longer read refs during render or set state synchronously inside effects. No public API change; a few state updates now land one frame earlier.
