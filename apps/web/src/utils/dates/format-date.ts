/**
 * Formats a date in a human-readable format
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}
