"use client";

import { trpc } from "@/lib/trpc/trpc-client";
import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { BadgeAlert, BadgeCheck, MoreVertical } from "lucide-react";
import { EmailVerifiedToggle } from "./email-verified-toggle.client";

interface EmailInformationProps {
  userId: string;
}

export function EmailInformation({ userId }: EmailInformationProps) {
  const emailQuery = trpc.admin.users.details.getUserEmail.useQuery({
    userId,
  });

  return matchQueryStatus(emailQuery, {
    Loading: (
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="size-8" />
      </div>
    ),
    Errored: (
      <div className="text-sm text-red-600">
        Erreur lors de la récupération de l&apos;email
      </div>
    ),
    Empty: <div />,
    Success: (query) => {
      const emailData = query.data;
      if (!emailData) {
        return <div />;
      }
      return (
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-1.5 font-medium">
              <Tooltip>
                <TooltipTrigger asChild>
                  {emailData.emailVerified ? (
                    <BadgeCheck className="size-4 text-blue-400" />
                  ) : (
                    <BadgeAlert className="size-4 text-red-600" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  {emailData.emailVerified
                    ? "Email vérifié"
                    : "Email non vérifié"}
                </TooltipContent>
              </Tooltip>
              <span>{emailData.email}</span>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-fit" align="end">
              <div className="space-y-4">
                <EmailVerifiedToggle
                  userId={userId}
                  isVerified={emailData.emailVerified}
                />

                {/* We can send verification email only for currently logged in user, find a workaround */}
                {/* <SendVerificationEmailButton
                  email={emailData.email}
                  variant="default"
                  size="sm"
                >
                  Renvoyer l&apos;email de vérification
                </SendVerificationEmailButton> */}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
  });
}
