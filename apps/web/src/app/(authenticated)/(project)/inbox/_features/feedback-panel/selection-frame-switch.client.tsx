"use client";

import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { cn } from "@workspace/ui/lib/utils";
import { useId } from "react";

type SelectionFrameSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function SelectionFrameSwitch({
  checked,
  onCheckedChange,
  className,
}: SelectionFrameSwitchProps) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-xs font-normal text-muted-foreground">
        Show selection frame
      </Label>
    </div>
  );
}
