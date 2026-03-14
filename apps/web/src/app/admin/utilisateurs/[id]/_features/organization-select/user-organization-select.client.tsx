"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface UserOrganizationSelectProps {
  userId: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function UserOrganizationSelect({
  userId,
  value,
  onValueChange,
  placeholder = "Select an organization",
}: UserOrganizationSelectProps) {
  const organizationsQuery = trpc.admin.users.organisations.list.useQuery({
    userId,
  });

  return matchQueryStatus(organizationsQuery, {
    Loading: <Skeleton className="h-10 w-full rounded-md" />,
    Errored: (error) => (
      <div className="text-sm text-red-500">
        Failed to load organizations: {String(error)}
      </div>
    ),
    Empty: (
      <div className="text-sm text-muted-foreground">
        Aucune organisation trouvée pour cet utilisateur
      </div>
    ),
    Success: () => (
      <Select onValueChange={onValueChange} value={value}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {organizationsQuery.data?.map((org: any) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ),
  });
}
