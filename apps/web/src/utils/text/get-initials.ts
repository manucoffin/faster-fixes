export const getInitials = (value: string, maxLength = 2) => {
  return value
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, maxLength);
};
