import {
  JSXConverters,
  RichText as RichTextConverter,
} from "@payloadcms/richtext-lexical/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

interface SerializedTableCellNode {
  type: "tablecell";
  children: any[];
  colSpan?: number;
  rowSpan?: number;
  headerState: number; // 0 = normal cell, >0 = header
  backgroundColor?: string | null;
}

interface SerializedTableRowNode {
  type: "tablerow";
  children: SerializedTableCellNode[];
}

interface SerializedTableNode {
  type: "table";
  children: SerializedTableRowNode[];
}

const CellContent = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <RichTextConverter
      data={{
        root: {
          children: data,
          type: "root",
          version: 1,
          direction: null,
          format: "",
          indent: 0,
        },
      }}
      className="prose prose-gray dark:prose-invert prose-sm text-wrap *:m-0 *:last:m-0"
    />
  );
};

export const experimentalTableConverter: JSXConverters<any> = {
  table: ({ node }: { node: SerializedTableNode }) => {
    const { children: rows } = node;

    if (!rows || rows.length === 0) {
      return (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-600">
            Table requires at least one row
          </p>
        </div>
      );
    }

    // Separate header rows from body rows
    // Header rows are those where at least one cell has headerState > 0
    const headerRows: SerializedTableRowNode[] = [];
    const bodyRows: SerializedTableRowNode[] = [];

    for (const row of rows) {
      const hasHeaderCell = row.children.some(
        (cell: SerializedTableCellNode) => cell.headerState > 0
      );
      if (hasHeaderCell) {
        headerRows.push(row);
      } else {
        bodyRows.push(row);
      }
    }

    return (
      <div className="not-prose my-4 overflow-x-auto">
        <Table>
          {headerRows.length > 0 && (
            <TableHeader className="bg-secondary/20">
              {headerRows.map((row, rowIndex) => (
                <TableRow key={`header-${rowIndex}`}>
                  {row.children.map((cell: SerializedTableCellNode, cellIndex: number) => (
                    <TableHead
                      key={`header-cell-${rowIndex}-${cellIndex}`}
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                      style={{
                        backgroundColor: cell.backgroundColor || undefined,
                      }}
                    >
                      <CellContent data={cell.children} />
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
          )}
          {bodyRows.length > 0 && (
            <TableBody>
              {bodyRows.map((row, rowIndex) => (
                <TableRow key={`body-${rowIndex}`}>
                  {row.children.map((cell: SerializedTableCellNode, cellIndex: number) => (
                    <TableCell
                      key={`body-cell-${rowIndex}-${cellIndex}`}
                      colSpan={cell.colSpan || 1}
                      rowSpan={cell.rowSpan || 1}
                      style={{
                        backgroundColor: cell.backgroundColor || undefined,
                      }}
                    >
                      <CellContent data={cell.children} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
      </div>
    );
  },
};
