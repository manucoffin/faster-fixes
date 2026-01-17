export function formatRelativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat("fr", { style: "short" });

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "maintenant";
  } else if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, "minute");
  } else if (diffInHours < 24) {
    return rtf.format(-diffInHours, "hour");
  } else {
    return rtf.format(-diffInDays, "day");
  }
}
