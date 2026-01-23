"use client";

import { DataTable } from "@/app/_features/core/datatable/data-table";
import { DataTableColumnHeader } from "@/app/_features/core/datatable/data-table-column-header";
import { trpc } from "@/lib/trpc/trpc-client";
import { SubscriptionPlanName } from "@/server/auth/config/subscription-plans";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/radio-group";
import { Filter } from "lucide-react";
import Link from "next/link";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryState,
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
          <Link href={`/admin/users/${row.original.id}`}>
            <div className="flex items-center gap-2">
              <span>{name || "—"}</span>
              {subscriptionPlan && (
                <Badge
                  variant={
                    subscriptionPlan === SubscriptionPlanName.Balto
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
  // Sync 'search', 'page', and 'role' with URL query parameters
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault(""),
  );
  const [currentPage, setCurrentPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1),
  );
  const [typeFilter, setTypeFilter] = useQueryState(
    "type",
    parseAsStringEnum<UserType>(Object.values(UserType)),
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

  // Reset to first page when role filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, setCurrentPage]);

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
    trpc.admin.users.getPaginatedUsers.useQuery({
      search,
      page: currentPage,
      pageSize,
      type: typeFilter || undefined,
      sortBy: (sortBy as "name" | "email" | "createdAt") || undefined,
      sortOrder: (sortOrder as "asc" | "desc") || undefined,
    });

  // Fetch export data separately (will be fetched on demand by the export button)
  const { data: exportData } = trpc.admin.users.getAllUsersForExport.useQuery({
    search,
    type: typeFilter || undefined,
  });

  // Calculate total pages
  const pageCount = data ? Math.ceil(data.count / pageSize) : 0;

  // Type filter values
  const typeOptions = [
    { value: "all", label: "Tous les types" },
    { value: UserType.PetParent, label: "Pet Parent" },
    { value: UserType.Professional, label: "Professionnel" },
  ];

  // Handle sorting changes
  const handleSortingChange = (
    newSorting: Array<{ id: string; desc: boolean }>,
  ) => {
    if (newSorting.length === 0) {
      setSortBy("");
      setSortOrder("");
    } else {
      const sort = newSorting[0];
      setSortBy(sort.id);
      setSortOrder(sort.desc ? "desc" : "asc");
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
      filterComponents={
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres
              {typeFilter && (
                <Badge variant="secondary" className="ml-1">
                  1
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-sm font-medium">
                  Type d&apos;utilisateur
                </p>
                <RadioGroup
                  value={typeFilter || "all"}
                  onValueChange={(value) =>
                    setTypeFilter(value === "all" ? null : (value as UserType))
                  }
                >
                  {typeOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label
                        htmlFor={option.value}
                        className="cursor-pointer font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              {typeFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTypeFilter(null)}
                  className="w-full"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      }
    />
  );
};
