export const getInitials = (value: string, maxLength: number = 2) => {
  return value
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, maxLength);
};