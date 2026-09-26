import { STATUS_COLORS } from "@fasterfixes/core";

export function getStatusColor(status: string) {
  // why: the status comes from an API response, so a newer server can send one this build does not know
  const colors: Partial<Record<string, string>> = STATUS_COLORS;
  return colors[status] ?? STATUS_COLORS.new;
}
