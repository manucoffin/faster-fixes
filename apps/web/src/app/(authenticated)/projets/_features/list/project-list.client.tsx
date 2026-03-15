"use client";

import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

export function ProjectList() {
  const trpc = useTRPC();
  const { data: activeOrg } = useActiveOrganization();

  const projectsQuery = useQuery(
    trpc.authenticated.projets.list.queryOptions(
      { organizationId: activeOrg?.id ?? "" },
      { enabled: !!activeOrg?.id },
    ),
  );

  return matchQueryStatus(projectsQuery, {
    Loading: <p className="text-muted-foreground text-sm">Chargement...</p>,
    Errored: <p className="text-destructive text-sm">Erreur lors du chargement des projets.</p>,
    Empty: (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground" />
        <div>
          <p className="text-lg font-medium">Aucun projet</p>
          <p className="text-sm text-muted-foreground">
            Créez votre premier projet pour commencer à collecter des retours.
          </p>
        </div>
        <Button asChild>
          <Link href="/projets/nouveau">
            <Plus className="mr-2 h-4 w-4" />
            Créer un projet
          </Link>
        </Button>
      </div>
    ),
    Success: ({ data: projects }) => (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Retours</TableHead>
            <TableHead>Créé</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link href={`/projets/${project.id}`} className="hover:underline">
                  {project.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{project.url}</TableCell>
              <TableCell>{project.feedbackCount}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(project.createdAt, {
                  addSuffix: true,
                  locale: fr,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  });
}
