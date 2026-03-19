"use client";

import { CreateProjectDialog } from "@/app/(authenticated)/projects/_features/create/create-project-dialog.client";
import { useActiveOrganization } from "@/lib/auth";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { AlertCircle, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

const TABLE_COLUMNS = 4;
const SKELETON_ROWS = 3;

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
    Loading: (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Feedback</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <TableRow key={index}>
              {Array.from({ length: TABLE_COLUMNS }).map((_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
    Errored: (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle />
          </EmptyMedia>
          <EmptyTitle>Failed to load projects</EmptyTitle>
          <EmptyDescription>
            Something went wrong. Please try again later.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    ),
    Empty: (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyTitle>No projects</EmptyTitle>
          <EmptyDescription>
            Create your first project to start collecting feedback.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <CreateProjectDialog>
            <Button>
              <Plus className="size-4" />
              Create project
            </Button>
          </CreateProjectDialog>
        </EmptyContent>
      </Empty>
    ),
    Success: ({ data: projects }) => (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>URL</TableHead>
            <TableHead>Feedback</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/projects/${project.id}`}
                  className="hover:underline"
                >
                  {project.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {project.url}
              </TableCell>
              <TableCell>{project.feedbackCount}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(project.createdAt, {
                  addSuffix: true,
                  locale: enUS,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ),
  });
}
