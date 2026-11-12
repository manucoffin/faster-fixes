import type { ConsoleEntry, NetworkEntry } from "@fasterfixes/core";

// One Diagnostic Trail entry, as the Diagnostics section and the timeline show it.
export function formatConsoleEntry(entry: ConsoleEntry): string {
  return `\`${entry.level}\` ${collapseWhitespace(entry.message)}`;
}

export function formatNetworkEntry(entry: NetworkEntry): string {
  const status = entry.status === 0 ? "ERR" : String(entry.status);
  return `\`${entry.method}\` ${entry.url} → ${status} (${Math.round(entry.duration)}ms)`;
}

// Console messages can be multi-line; flatten so each entry stays one bullet.
export function collapseWhitespace(value: string): string {
  return value.replace(/\s*\n\s*/g, " ").trim();
}
