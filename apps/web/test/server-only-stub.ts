// `server-only` is resolved by the Next.js compiler, not by node, so Vitest
// aliases it to this empty module (see vitest.config.ts). It keeps the tests
// of the modules that guard themselves with it running outside Next.js.
export {};
