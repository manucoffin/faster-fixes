"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { ReactNode, useState } from "react";
import { PlanSelection } from "./plan-selection.client";

interface UpgradeSubscriptionDialogProps {
  trigger?: ReactNode;
}

export function UpgradeSubscriptionDialog({
  trigger,
}: UpgradeSubscriptionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">Change plan</Button>}
      </DialogTrigger>
      <DialogContent className="h-full w-full max-w-full overflow-y-auto sm:max-h-[95svh] sm:max-w-[90svw] md:h-fit xl:max-w-[60svw]">
        <DialogHeader className="h-fit">
          <DialogTitle>Choose your plan</DialogTitle>
          <DialogDescription>
            Select the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>

        {isOpen && <PlanSelection />}
      </DialogContent>
    </Dialog>
  );
}
