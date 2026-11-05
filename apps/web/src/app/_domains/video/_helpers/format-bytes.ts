/**
 * A file size in decimal units, as storage is billed: whole MB below a
 * gigabyte, one decimal of GB above, a trailing `.0` dropped.
 */
export function formatBytes(bytes: number) {
  if (bytes >= 1e9) return `${trimZero((bytes / 1e9).toFixed(1))} GB`;
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} MB`;
  if (bytes >= 1e3) return `${Math.round(bytes / 1e3)} KB`;
  return `${Math.max(0, Math.round(bytes))} B`;
}

function trimZero(value: string) {
  return value.endsWith(".0") ? value.slice(0, -2) : value;
}
