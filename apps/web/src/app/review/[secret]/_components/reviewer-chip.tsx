import { UserRoundIcon } from "lucide-react";

// The Reviewer has no account: before the first comment there is nothing to
// show but the promise that a name will be asked.
export function ReviewerChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
      <UserRoundIcon className="size-3.5" />
      You pick a name with your first comment
    </span>
  );
}
