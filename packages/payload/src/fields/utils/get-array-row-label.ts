import type { RowLabelComponent } from "payload";

export const getArrayRowLabel = ({
  fieldName,
  itemPlaceholder,
}: {
  fieldName: string;
  itemPlaceholder?: string;
}): RowLabelComponent => {
  return {
    path: "@workspace/payload/components/array-row-label#ArrayRowLabel",
    clientProps: {
      fieldName: fieldName,
      itemPlaceholder: itemPlaceholder,
    },
  };
};
