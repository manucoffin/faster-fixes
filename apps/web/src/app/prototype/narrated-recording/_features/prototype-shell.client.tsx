"use client";

// PROTOTYPE, throwaway (issue #500). Three variants of narrated Recording
// playback, switchable via `?variant=`, plus `?view=inbox` for the board card
// and feedback panel treatments. Fake data, no sound.
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { InboxView } from "./inbox-view";
import { VariantA } from "./variant-a.client";
import { VariantB } from "./variant-b.client";
import { VariantC } from "./variant-c.client";

const VARIANTS = [
  { key: "A", name: "Voice in the log", Component: VariantA },
  { key: "B", name: "Transcript first", Component: VariantB },
  { key: "C", name: "Tracks", Component: VariantC },
  { key: "inbox", name: "Board card and panel", Component: InboxView },
] as const;

type PrototypeShellProps = { variant: string };

export function PrototypeShell({ variant }: PrototypeShellProps) {
  const router = useRouter();
  const index = Math.max(
    0,
    VARIANTS.findIndex((item) => item.key === variant),
  );
  const current = VARIANTS[index] ?? VARIANTS[0];
  const Component = current.Component;

  const go = (step: number) => {
    const next = VARIANTS[(index + step + VARIANTS.length) % VARIANTS.length];
    router.replace(
      `/prototype/narrated-recording?variant=${next?.key ?? "A"}` as Route,
    );
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <h1 className="text-sm font-semibold">Narrated recording</h1>
        <span className="text-sm text-muted-foreground">
          Camille Roy, on /cart
        </span>
        {process.env.NODE_ENV !== "production" && (
          <div className="ml-auto flex items-center gap-1 rounded-full bg-fuchsia-600 px-1.5 py-1 text-sm font-medium text-white shadow-lg">
            <button
              type="button"
              aria-label="Previous variant"
              className="cursor-pointer rounded-full p-1 hover:bg-white/20"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2">
              {current.key} ({current.name}). Prototype: fake data, no sound.
            </span>
            <button
              type="button"
              aria-label="Next variant"
              className="cursor-pointer rounded-full p-1 hover:bg-white/20"
              onClick={() => go(1)}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
      {/* Remounts per variant so each starts from its own clock. */}
      <Component key={current.key} />
    </div>
  );
}
