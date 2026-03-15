"use client";

import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/utils/dates/format-date";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { cn } from "@workspace/ui/lib/utils";
import { DownloadIcon } from "lucide-react";

function getMonthName(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function InvoiceLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border-border flex items-start justify-between border-b pb-2"
        >
          <div className="w-56 space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="size-40" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      ))}
    </div>
  );
}

export function PastInvoicesCard() {
  const trpc = useTRPC();

  const getPastInvoicesQuery =
    useQuery(trpc.authenticated.account.billing.invoices.list.queryOptions());

  return matchQueryStatus(getPastInvoicesQuery, {
    Loading: (
      <Card>
        <CardHeader>
          <CardTitle>Factures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-80 overflow-y-auto pr-1">
            <InvoiceLoadingSkeleton />
          </div>
        </CardContent>
      </Card>
    ),
    Errored: (
      <Card>
        <CardHeader>
          <CardTitle>Erreur</CardTitle>
          <CardDescription>
            Une erreur est survenue lors du chargement de vos factures
          </CardDescription>
        </CardHeader>
      </Card>
    ),
    Empty: (
      <Card>
        <CardContent className="pt-6">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Aucune facture</EmptyTitle>
              <EmptyDescription>
                Vous n&apos;avez pas encore de factures disponibles
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    ),
    dataKey: "invoices",
    Success: ({ data }) => {
      const invoices = data.invoices;

      return (
        <Card>
          <CardHeader>
            <CardTitle>Factures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto pr-1">
              <div className="space-y-4">
                {invoices.map((invoice, index) => (
                  <div
                    key={invoice.id}
                    className={cn(
                      "flex items-start justify-between pb-2",
                      index !== invoices.length - 1
                        ? "border-border border-b"
                        : "",
                    )}
                  >
                    <div className="w-56 space-y-1">
                      <div className="flex w-full items-baseline">
                        <span className="font-medium">
                          {getMonthName(new Date(invoice.created * 1000))}
                        </span>
                        <div className="border-muted-foreground mx-2 flex-1 border-b border-dotted"></div>
                        <span className="text-sm">
                          {((invoice.total || 0) / 100).toFixed(2)} €
                        </span>
                      </div>
                      <small className="text-muted-foreground">
                        {formatDate(new Date(invoice.created * 1000))}
                      </small>
                    </div>

                    {invoice.invoice_pdf && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <DownloadIcon className="size-4" />
                          Télécharger
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
  });
}
