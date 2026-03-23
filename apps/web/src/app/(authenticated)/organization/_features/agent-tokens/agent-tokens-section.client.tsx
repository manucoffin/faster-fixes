"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { TokenActionsDropdown } from "./token-actions-dropdown.client";

function formatDate(date: Date | string | null): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatScopes(scopes: string[]): string {
  return scopes
    .map((s) => {
      switch (s) {
        case "feedbacks:read":
          return "Read";
        case "feedbacks:update_status":
          return "Update status";
        default:
          return s;
      }
    })
    .join(", ");
}

export function AgentTokensSection() {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();

  const tokensQuery = useQuery(
    trpc.authenticated.organization.agentToken.list.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    ),
  );

  const tokens = tokensQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Token</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Last used</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => (
            <TableRow key={token.id}>
              <TableCell className="font-medium">{token.name}</TableCell>
              <TableCell>
                <code className="text-muted-foreground text-xs">
                  ff_agent_••••{token.tokenLastFour}
                </code>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatScopes(token.scopes)}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(token.lastUsedAt)}
              </TableCell>
              <TableCell>
                {token.isActive ? (
                  <Badge variant="outline">Active</Badge>
                ) : (
                  <Badge variant="secondary">Revoked</Badge>
                )}
              </TableCell>
              <TableCell>
                <TokenActionsDropdown
                  tokenId={token.id}
                  isActive={token.isActive}
                />
              </TableCell>
            </TableRow>
          ))}

          {tokens.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-muted-foreground py-8 text-center"
              >
                No agent tokens yet. Create one to authenticate the Faster
                Fixes MCP server.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
