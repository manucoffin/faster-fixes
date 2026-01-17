/**
 * Formats a duration in minutes to a human-readable string.
 * Examples:
 * - 45 -> "45m"
 * - 60 -> "1h"
 * - 90 -> "1h 30m"
 *
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
export function formatDuration(minutes: number): string {
  if (!minutes && minutes !== 0) return "—";

  if (minutes < 60) {
    return `${minutes}min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${remainingMinutes}`;
}