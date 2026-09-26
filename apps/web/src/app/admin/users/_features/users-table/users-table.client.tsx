"use client";

import { DataTable } from "@/app/_components/data-table.client";
import { DataTableColumnHeader } from "@/app/_components/data-table-column-header.client";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { getErrorMessage } from "@/utils/error/get-error-message";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionPlanName } from "@/app/_domains/subscription";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import type { ListUsersOutput } from "@/app/admin/users/_services/list-users";
import { UsersTableActionDropdown } from "./users-table-action-dropdown.client";

// Define the columns for the Users table
const columns: ColumnDef<ListUsersOutput["users"][number]>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row, getValue }) => {
      const name = getValue<string>();
      const organizationName = row.original.members[0]?.organization.name;
      const subscriptionPlan =
        row.original.members[0]?.organization.subscription?.plan;

      return (
        <div className="flex flex-col gap-1">
          <Link href={`/admin/users/${row.original.id}`}>
            <div className="flex items-center gap-2">
              <span>{name || "N/A"}</span>
              {subscriptionPlan && (
                <Badge
                  variant={
                    subscriptionPlan === SubscriptionPlanName.Agency
                      ? "default"
                      : "secondary"
                  }
                  className="w-fit px-1 py-0 text-xs capitalize"
                >
                  {subscriptionPlan.toLowerCase()}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {organizationName ?? "N/A"}
            </div>
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ getValue }) => {
      const email = getValue<string>();
      return email ? <span>{email}</span> : <span>{"N/A"}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created at" />
    ),
    cell: ({ getValue }) => {
      const date = new Date(getValue<string>());
      return <div>{date.toLocaleDateString("en-US")}</div>;
    },
    enableSorting: true,
  },
  {
    accessorKey: "feedbackCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Feedback" />
    ),
    cell: ({ getValue }) => (
      <div className="tabular-nums">{getValue<number>()}</div>
    ),
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const userId = row.original.id;

      return <UsersTableActionDropdown userId={userId} />;
    },
  },
];

export function UsersTable() {
  const trpc = useTRPC();
  // Sync 'search', 'page', and 'role' with URL query parameters
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1),
  );

  // Initialize searchInput from the 'search' query parameter
  const [searchInput, setSearchInput] = useState(search);

  // Refs to track if the component has mounted and if search was changed by user
  const isInitialMount = useRef(true);
  const isUserSearch = useRef(false);

  // Resync the input when 'search' changes outside it (URL navigation), adjusted during render
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (search !== syncedSearch) {
    setSyncedSearch(search);
    setSearchInput(search);
  }

  const pageSize = 10; // Number of rows per page

  // Debounce search input and update the 'search' query parameter only if it differs
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (searchInput === search) {
      return;
    }

    isUserSearch.current = true; // Indicate that the search is triggered by user
    const handler = setTimeout(() => {
      void setSearch(searchInput);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput, search, setSearch]);

  // Reset to first page when the debounced search changes, but only if it was a user search
  useEffect(() => {
    if (isUserSearch.current) {
      void setCurrentPage(1);
      isUserSearch.current = false;
    }
  }, [search, setCurrentPage]);

  // Get sorting state from URL or use default
  const [sortBy, setSortBy] = useQueryState(
    "sortBy",
    parseAsString.withDefault(""),
  );
  const [sortOrder, setSortOrder] = useQueryState(
    "sortOrder",
    parseAsString.withDefault(""),
  );

  // eslint-disable-next-line local/no-query-status-branch -- the table keeps its search field and rows mounted across search and pagination
  const { data, isLoading, isError, error } = useQuery(
    trpc.admin.users.list.queryOptions({
      search,
      page: currentPage,
      pageSize,
      sortBy:
        sortBy === ""
          ? undefined
          : (sortBy as "name" | "email" | "createdAt" | "feedbackCount"),
      sortOrder: sortOrder === "" ? undefined : (sortOrder as "asc" | "desc"),
    }),
  );

  // Fetch export data separately (will be fetched on demand by the export button)
  const { data: exportData } = useQuery(
    trpc.admin.users.listForExport.queryOptions({
      search,
    }),
  );

  // Calculate total pages
  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;

  // Handle sorting changes
  const handleSortingChange = (
    newSorting: Array<{ id: string; desc: boolean }>,
  ) => {
    if (newSorting.length === 0) {
      void setSortBy("");
      void setSortOrder("");
    } else {
      const sort = newSorting[0];
      void setSortBy(sort?.id ?? null);
      void setSortOrder(sort?.desc ? "desc" : "asc");
      // Reset to first page when sorting changes
      void setCurrentPage(1);
    }
  };

  return (
    <DataTable
      columns={columns}
      data={data?.users ?? []}
      pageCount={pageCount}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      search={searchInput}
      setSearch={setSearchInput}
      isLoading={isLoading}
      isError={isError}
      errorMessage={getErrorMessage(error)}
      searchInputPlaceholder="Search for a user..."
      onSortingChange={handleSortingChange}
      exportConfig={{
        enabled: true,
        filename: `users-${new Date().toISOString().split("T")[0]}.csv`,
        data: exportData ?? [],
      }}
    />
  );
}
