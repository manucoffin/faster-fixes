// The value is passed in rather than read by name so each call site keeps a
// static `process.env.X` access, which Next.js inlines and turbo's env lint sees.
export function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}
