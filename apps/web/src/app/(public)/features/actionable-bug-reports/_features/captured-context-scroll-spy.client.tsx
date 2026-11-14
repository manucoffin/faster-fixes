"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  CONTEXT_GROUP_KEYS,
  FeedbackAnatomyIllustration,
  type ContextGroupKey,
} from "../_components/illustrations/feedback-anatomy-illustration";

// Set on each list item by the server-rendered list.
const CONTEXT_GROUP_ATTRIBUTE = "data-context-group";

type CapturedContextScrollSpyProps = {
  // The server-rendered list, whose items carry `data-context-group`.
  children: ReactNode;
};

export function CapturedContextScrollSpy({
  children,
}: CapturedContextScrollSpyProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [activeGroup, setActiveGroup] = useState<ContextGroupKey | null>(null);

  useEffect(() => {
    const items = listRef.current?.querySelectorAll<HTMLElement>(
      `[${CONTEXT_GROUP_ATTRIBUTE}]`,
    );
    if (!items?.length) return;

    // A thin band in the upper part of the viewport: the item crossing it is
    // the one being read. Higher than the middle so the first item lights up
    // once the sticky illustration is fully in view, not as it scrolls in.
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries.find(({ isIntersecting }) => isIntersecting);
        const key = entry?.target.getAttribute(CONTEXT_GROUP_ATTRIBUTE);
        if (isContextGroupKey(key)) setActiveGroup(key);
      },
      { rootMargin: "-20% 0px -75% 0px" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-12 grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
      <div ref={listRef}>{children}</div>
      <FeedbackAnatomyIllustration
        activeGroup={activeGroup}
        className="aspect-[4/5] lg:sticky lg:top-24"
      />
    </div>
  );
}

function isContextGroupKey(
  value: string | null | undefined,
): value is ContextGroupKey {
  return CONTEXT_GROUP_KEYS.some((key) => key === value);
}
