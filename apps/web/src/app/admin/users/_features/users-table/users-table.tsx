"use client";

import { DataTable } from "@/app/_features/core/datatable/data-table";
import { DataTableColumnHeader } from "@/app/_features/core/datatable/data-table-column-header";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { SubscriptionPlanName } from "@/server/auth/config/subscription-plans";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import Link from "next/link";
import {
  parseAsInteger,
  parseAsString,
  useQueryState
} from "nuqs";
import { useEffect, useRef, useState } from "react";
import { GetPaginatedUsersOutput } from "./get-paginated-users";
import { UsersTableActionDropdown } from "./users-table-action-dropdown";

// Define the columns for the Users table
const columns: ColumnDef<GetPaginatedUsersOutput["users"][number]>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nom" />
    ),
    cell: ({ row, getValue }) => {
      const name = getValue<string>();
      const organizationName = row.original.members[0]?.organization?.name;
      const subscriptionPlan =
        row.original.members[0]?.organization?.subscription?.plan;

      return (
        <div className="flex flex-col gap-1">
          <Link href={`/admin/utilisateurs/${row.original.id}`}>
            <div className="flex items-center gap-2">
              <span>{name || "—"}</span>
              {subscriptionPlan && (
                <Badge
                  variant={
                    subscriptionPlan === SubscriptionPlanName.Basic
                      ? "default"
                      : "secondary"
                  }
                  className="w-fit px-1 py-0 text-xs capitalize"
                >
                  {subscriptionPlan.toLowerCase()}
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground text-xs">
              {organizationName || "—"}
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
      return email ? <span>{email}</span> : <span>{"—"}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date de création" />
    ),
    cell: ({ row, getValue }) => {
      const date = new Date(getValue<string>());
      return <div>{date.toLocaleDateString("fr-FR")}</div>;
    },
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

export const UsersTable = () => {
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

  // Update searchInput when 'search' changes (e.g., on initial load or URL change)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const pageSize = 10; // Number of rows per page

  // Debounce search input and update the 'search' query parameter only if it differs
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (searchInput !== search) {
      isUserSearch.current = true; // Indicate that the search is triggered by user
      const handler = setTimeout(() => {
        setSearch(searchInput);
      }, 500); // 500ms debounce

      return () => {
        clearTimeout(handler);
      };
    }
  }, [searchInput, search, setSearch]);

  // Reset to first page when the debounced search changes, but only if it was a user search
  useEffect(() => {
    if (isUserSearch.current) {
      setCurrentPage(1);
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

  const { data, isLoading, isError } =
    useQuery(trpc.admin.users.list.queryOptions({
      search,
      page: currentPage,
      pageSize,
      sortBy: (sortBy as "name" | "email" | "createdAt") || undefined,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    }));

  // Fetch export data separately (will be fetched on demand by the export button)
  const { data: exportData } = useQuery(trpc.admin.users.export.queryOptions({
    search,
  }));

  // Calculate total pages
  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;

  // Handle sorting changes
  const handleSortingChange = (
    newSorting: Array<{ id: string; desc: boolean }>,
  ) => {
    if (newSorting.length === 0) {
      setSortBy("");
      setSortOrder("");
    } else {
      const sort = newSorting[0];
      setSortBy(sort?.id || null);
      setSortOrder(sort?.desc ? "desc" : "asc");
      // Reset to first page when sorting changes
      setCurrentPage(1);
    }
  };

  return (
    <DataTable
      columns={columns}
      data={data?.users || []}
      pageCount={pageCount}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      search={searchInput}
      setSearch={setSearchInput}
      isLoading={isLoading}
      isError={isError}
      errorMessage="Une erreur est survenue"
      searchInputPlaceholder="Rechercher un utilisateur..."
      onSortingChange={handleSortingChange}
      exportConfig={{
        enabled: true,
        filename: `utilisateurs-${new Date().toISOString().split("T")[0]}.csv`,
        data: exportData || [],
      }}
    />
  );
};
