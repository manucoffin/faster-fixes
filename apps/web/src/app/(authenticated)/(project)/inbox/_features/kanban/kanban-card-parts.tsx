import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { GithubIcon } from "@workspace/ui/components/icons/github-icon";
import { JiraIcon } from "@workspace/ui/components/icons/jira-icon";
import { TrelloIcon } from "@workspace/ui/components/icons/trello-icon";
import { LinearIcon } from "@workspace/ui/components/icons/linear-icon";
import { cn } from "@workspace/ui/lib/utils";
import { Clock, UserRound } from "lucide-react";
import type { ListFeedbackOutput } from "../../_services/list-feedback";

type FeedbackItem = ListFeedbackOutput[number];

// Soft, low-chroma palette so people add warmth without competing with the
// status colours.
const PERSON_COLORS = [
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  "bg-orange-500/15 text-orange-700 dark:text-orange-300",
] as const;

// Hashing the name keeps a person's colour stable across cards and reloads.
function getPersonColor(name: string) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PERSON_COLORS[hash % PERSON_COLORS.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

type AssigneeAvatarProps = {
  assignee: FeedbackItem["assignee"];
};

export function AssigneeAvatar({ assignee }: AssigneeAvatarProps) {
  if (!assignee) {
    return (
      <div
        className="flex size-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/60"
        title="Unassigned"
      >
        <UserRound className="size-3" />
      </div>
    );
  }

  return (
    <Avatar className="size-5" title={assignee.name}>
      <AvatarImage
        src={assignee.image ? resolveS3Url(assignee.image) : undefined}
        className="object-cover"
      />
      <AvatarFallback
        className={cn(
          "text-[9px] font-semibold",
          getPersonColor(assignee.name),
        )}
      >
        {getInitials(assignee.name)}
      </AvatarFallback>
    </Avatar>
  );
}

type TrackerChipsProps = {
  feedback: FeedbackItem;
};

export function TrackerChips({ feedback }: TrackerChipsProps) {
  const chips = [
    feedback.issueLink && {
      key: "github",
      icon: GithubIcon,
      label: `#${feedback.issueLink.issueNumber}`,
    },
    feedback.linearIssueLink && {
      key: "linear",
      icon: LinearIcon,
      label: feedback.linearIssueLink.issueIdentifier,
    },
    feedback.jiraIssueLink && {
      key: "jira",
      icon: JiraIcon,
      label: feedback.jiraIssueLink.issueKey,
    },
    feedback.trelloIssueLink && {
      key: "trello",
      icon: TrelloIcon,
      label: "Card",
    },
  ].filter((chip) => !!chip);

  return chips.map(({ key, icon: Icon, label }) => (
    <span
      key={key}
      className="inline-flex shrink-0 items-center gap-1 rounded border border-border bg-background px-1.5 py-px text-[11px] font-medium text-muted-foreground"
    >
      <Icon className="size-3" />
      {label}
    </span>
  ));
}

type WaitingChipProps = {
  days: number;
};

export function WaitingChip({ days }: WaitingChipProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-500/15 px-1.5 py-px text-[11px] font-medium text-amber-700 dark:text-amber-300">
      <Clock className="size-3" />
      Waiting {days} days
    </span>
  );
}
