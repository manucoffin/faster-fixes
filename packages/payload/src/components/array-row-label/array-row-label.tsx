"use client";

import { useRowLabel } from "@payloadcms/ui";
import type { Data } from "payload";

export function ArrayRowLabel({
  itemPlaceholder,
  fieldName,
}: {
  itemPlaceholder?: string;
  fieldName: string;
}) {
  const { data, rowNumber } = useRowLabel<Data>();

  // Debug logging - remove once confirmed working
  if (process.env.NODE_ENV === 'development') {
    console.log('ArrayRowLabel Debug:', { data, rowNumber, fieldName, fieldValue: data?.[fieldName] });
  }

  return (
    `${data?.[fieldName]}` ||
    `${itemPlaceholder}: ${String(rowNumber).padStart(2, "0")}`
  );
}
