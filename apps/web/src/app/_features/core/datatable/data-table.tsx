"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  TableMeta,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { AlertCircle, Search } from "lucide-react";
import { DataTableExportButton } from "./data-table-export-button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  search: string;
  setSearch: (search: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
  isError?: boolean;
  searchInputPlaceholder?: string;
  meta?: TableMeta<TData>;
  filterComponents?: React.ReactNode;
  exportConfig?: {
    enabled: boolean;
    filename?: string;
    data: Array<Record<string, unknown>>;
  };
  onSortingChange?: (sorting: Array<{ id: string; desc: boolean }>) => void;
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  pageCount,
  currentPage,
  setCurrentPage,
  search,
  setSearch,
  isLoading = false,
  errorMessage = "Une erreur est survenue lors du chargement des données.",
  isError = false,
  searchInputPlaceholder = "Rechercher...",
  meta,
  filterComponents,
  exportConfig,
  onSortingChange,
}: DataTableProps<TData, TValue>) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // Handle sorting changes and call the callback
  const handleSortingChange = (updaterOrValue: any) => {
    const newSorting = typeof updaterOrValue === "function"
      ? updaterOrValue(sorting)
      : updaterOrValue;
    setSorting(newSorting);
    if (onSortingChange) {
      onSortingChange(newSorting);
    }
  };

  const table = useReactTable({
    meta,
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div>
      {/* Search Bar and Filters */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchInputPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-64 pl-12"
            />
          </div>
          {filterComponents}
        </div>
        {exportConfig?.enabled && (
          <DataTableExportButton
            filename={exportConfig.filename}
            data={exportConfig.data}
            disabled={isLoading}
          />
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: columns.length }).map(
                    (_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            ) : isError ? (
              // Error message
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="text-destructive flex items-center justify-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    <span>{errorMessage}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          Page {currentPage} sur {pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
};
