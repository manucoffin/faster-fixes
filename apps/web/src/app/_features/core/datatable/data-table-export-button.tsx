"use client";

import { Button } from "@workspace/ui/components/button";
import { Download } from "lucide-react";
import * as React from "react";
import * as XLSX from "xlsx";

interface DataTableExportButtonProps {
  filename?: string;
  data: Array<Record<string, unknown>>;
  disabled?: boolean;
}

export const DataTableExportButton = ({
  filename,
  data,
  disabled = false,
}: DataTableExportButtonProps) => {
  const handleExport = React.useCallback(() => {
    try {
      if (!data || data.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(data);

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const finalFilename = filename || `export-${timestamp}.csv`;

      // Write and trigger download with proper UTF-8 encoding
      XLSX.writeFile(wb, finalFilename, { bookType: "csv" });
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  }, [data, filename]);

  return (
    <Button
      onClick={handleExport}
      disabled={disabled}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Download className="size-4" />
      Exporter
    </Button>
  );
};
