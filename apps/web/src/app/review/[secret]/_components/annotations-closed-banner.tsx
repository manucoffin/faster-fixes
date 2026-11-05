import { LockIcon } from "lucide-react";

export function AnnotationsClosedBanner() {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 text-sm">
      <LockIcon className="size-4 shrink-0 text-muted-foreground" />
      <span>
        Annotations are closed on this video. You can still watch it and read
        the comments.
      </span>
    </div>
  );
}
