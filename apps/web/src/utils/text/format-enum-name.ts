/**
 * Formats an enum value by converting it to a more readable format
 *
 * Example: SOME_ENUM_VALUE -> Some Enum Value
 */
export function formatEnumName(value: string): string {
  if (!value) return "";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}