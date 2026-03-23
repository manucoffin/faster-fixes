"use client";

import { Button } from "@workspace/ui/components/button";
import { Plus } from "lucide-react";
import * as React from "react";
import { InviteMemberDialog } from "./create-invitation/invite-member-dialog.client";

export function InviteMemberButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Invite member
      </Button>
      <InviteMemberDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
