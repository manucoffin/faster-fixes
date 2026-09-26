// Severity is binary: `error` or `off`. A warning is a standard nobody has to
// meet, so the plugin presets that ship rules at `warn` (react-hooks, Next.js,
// turbo) are promoted here rather than trusted to `--max-warnings 0` in every
// caller. `binary-severity.test.js` holds every exported config to it.

function promote(entry) {
  if (entry === "warn" || entry === 1) return "error";
  if (Array.isArray(entry) && (entry[0] === "warn" || entry[0] === 1)) {
    return ["error", ...entry.slice(1)];
  }
  return entry;
}

/**
 * @param {import("eslint").Linter.Config[]} configs
 * @returns {import("eslint").Linter.Config[]}
 */
export function withBinarySeverity(configs) {
  return configs.map((entry) => {
    if (!entry.rules) return entry;
    return {
      ...entry,
      rules: Object.fromEntries(
        Object.entries(entry.rules).map(([name, value]) => [
          name,
          promote(value),
        ]),
      ),
    };
  });
}
