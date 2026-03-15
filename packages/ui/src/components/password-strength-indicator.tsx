"use client";

import { Check, Info, X } from "lucide-react";
import { useMemo } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

interface PasswordRule {
  label: string;
  test: (password: string) => boolean;
}

const defaultRules: PasswordRule[] = [
  { label: "Au moins 8 caractères", test: (p) => p.length >= 8 },
  { label: "Au moins une lettre", test: (p) => /[A-Za-z]/.test(p) },
  { label: "Au moins un chiffre", test: (p) => /\d/.test(p) },
  {
    label: "Au moins un caractère spécial",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

interface PasswordStrengthIndicatorProps {
  password: string;
  rules?: PasswordRule[];
}

const PasswordStrengthIndicator = ({
  password,
  rules = defaultRules,
}: PasswordStrengthIndicatorProps) => {
  const results = useMemo(
    () =>
      rules.map((rule) => ({
        ...rule,
        passed: password.length > 0 && rule.test(password),
      })),
    [password, rules],
  );

  const passedCount = results.filter((r) => r.passed).length;
  const totalSegments = rules.length;

  const getSegmentColor = (index: number) => {
    if (index >= passedCount) return "bg-muted";
    if (passedCount <= 1) return "bg-red-500";
    if (passedCount === 2) return "bg-orange-500";
    if (passedCount === 3) return "bg-amber-500";
    return "bg-green-500";
  };

  if (!password) return null;

  return (
    <div
      data-slot="password-strength-indicator"
      className="flex items-center gap-2"
    >
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Critères du mot de passe"
            className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <Info className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64">
          <p className="mb-2 text-sm font-medium">
            Votre mot de passe doit contenir :
          </p>
          <ul className="flex flex-col gap-1.5">
            {results.map((rule) => (
              <li key={rule.label} className="flex items-center gap-2 text-sm">
                {rule.passed ? (
                  <Check className="size-3.5 shrink-0 text-green-500" />
                ) : (
                  <X className="size-3.5 shrink-0 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    rule.passed ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {rule.label}
                </span>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </Popover>

      <div className="flex flex-1 gap-1">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              getSegmentColor(i),
            )}
          />
        ))}
      </div>
    </div>
  );
};

export { PasswordStrengthIndicator };
export type { PasswordRule, PasswordStrengthIndicatorProps };
