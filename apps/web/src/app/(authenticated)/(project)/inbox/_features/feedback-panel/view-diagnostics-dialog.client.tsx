"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { useQuery } from "@tanstack/react-query";
import type {
  ConsoleEntry,
  DiagnosticTrail,
  NetworkEntry,
} from "@fasterfixes/core";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Terminal } from "lucide-react";
import { useState } from "react";

type ViewDiagnosticsDialogProps = {
  projectId: string;
  feedbackId: string;
};

export function ViewDiagnosticsDialog({
  projectId,
  feedbackId,
}: ViewDiagnosticsDialogProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);

  // Fetch only once the modal is open — the trail is never loaded for the inbox list.
  const query = useQuery(
    trpc.authenticated.projects.feedback.getDiagnostics.queryOptions(
      { projectId, feedbackId },
      { enabled: open },
    ),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Terminal className="size-3.5" />
          View diagnostics
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Diagnostics</DialogTitle>
          <DialogDescription>
            Console and network activity captured before this feedback was
            submitted.
          </DialogDescription>
        </DialogHeader>
        {matchQueryStatus(query, {
          Loading: (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ),
          Errored: (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Could not load diagnostics.
            </p>
          ),
          Empty: (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No diagnostics were captured for this feedback.
            </p>
          ),
          Success: ({ data }) => <DiagnosticsTabs trail={data} />,
        })}
      </DialogContent>
    </Dialog>
  );
}

function DiagnosticsTabs({ trail }: { trail: DiagnosticTrail }) {
  const consoleCount = trail.console.length;
  const networkCount = trail.network.length;

  return (
    <Tabs defaultValue="console">
      <TabsList>
        <TabsTrigger value="console">Console ({consoleCount})</TabsTrigger>
        <TabsTrigger value="network">Network ({networkCount})</TabsTrigger>
      </TabsList>

      <TabsContent value="console">
        {consoleCount === 0 ? (
          <EmptyRow text="No console output captured." />
        ) : (
          <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-md border">
            {trail.console.map((entry, i) => (
              <ConsoleRow key={`${entry.timestamp}-${i}`} entry={entry} />
            ))}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="network">
        {networkCount === 0 ? (
          <EmptyRow text="No network requests captured." />
        ) : (
          <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-md border">
            {trail.network.map((entry, i) => (
              <NetworkRow key={`${entry.timestamp}-${i}`} entry={entry} />
            ))}
          </ul>
        )}
      </TabsContent>
    </Tabs>
  );
}

function ConsoleRow({ entry }: { entry: ConsoleEntry }) {
  const isError = entry.level === "error" || entry.level === "warn";
  return (
    <li className="flex gap-2 px-3 py-1.5 font-mono text-xs">
      <span
        className={`shrink-0 uppercase ${
          isError ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {entry.level}
      </span>
      <span className="break-all whitespace-pre-wrap">{entry.message}</span>
    </li>
  );
}

function NetworkRow({ entry }: { entry: NetworkEntry }) {
  const failed = entry.status === 0 || entry.status >= 400;
  return (
    <li className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs">
      <span className="w-12 shrink-0 text-muted-foreground">
        {entry.method}
      </span>
      <span className="flex-1 truncate" title={entry.url}>
        {entry.url}
      </span>
      <span
        className={`w-10 shrink-0 text-right ${
          failed ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {entry.status === 0 ? "err" : entry.status}
      </span>
      <span className="w-14 shrink-0 text-right text-muted-foreground">
        {Math.round(entry.duration)}ms
      </span>
    </li>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>
  );
}
