import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";
import type { ContextGroupKey } from "../_components/illustrations/feedback-anatomy-illustration";
import { CapturedContextScrollSpy } from "./captured-context-scroll-spy.client";

type ContextGroup = {
  key: ContextGroupKey;
  title: string;
  body: ReactNode;
};

const contextGroups: ContextGroup[] = [
  {
    key: "page",
    title: "The page and the exact element",
    body: (
      <>
        The page URL, the CSS selector of the clicked element, where it sits on
        the page and the viewport size. Nobody has to guess which button
        &quot;the button&quot; was.
      </>
    ),
  },
  {
    key: "browser",
    title: "Browser, OS and a screenshot",
    body: (
      <>
        The browser and its version, the operating system, and a full-page
        screenshot with the selected element framed on it.
      </>
    ),
  },
  {
    key: "components",
    title: "The React component behind the element",
    body: (
      <>
        On React development builds, the component tree and the source file of
        the selected element, so the fix starts in the right file.
      </>
    ),
  },
  {
    key: "diagnostics",
    title: "Console logs and network requests",
    body: (
      <>
        The last console entries and network requests before the report, with
        their status and duration. The error the client never saw is already in
        the report. Sensitive values such as tokens and passwords are redacted.
      </>
    ),
  },
  {
    key: "metadata",
    title: "Your own metadata",
    body: (
      <>
        Your site can attach its own context: a user ID, a tenant, a release
        version, a feature flag.{" "}
        <Link href={"/docs/widget/custom-metadata" as Route}>
          Custom metadata
        </Link>{" "}
        shows how.
      </>
    ),
  },
];

export function ActionableBugReportsCapturedContext() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>What every bug report carries</SectionHeading>
        <p className="mt-4 max-w-3xl text-xl leading-snug tracking-tight text-pretty text-muted-foreground md:text-2xl">
          Captured automatically when the client submits. They only write the
          comment.
        </p>

        <CapturedContextScrollSpy>
          <ul className="flex flex-col border-t">
            {contextGroups.map((group) => (
              <li
                key={group.key}
                data-context-group={group.key}
                className="border-b py-6 md:py-8"
              >
                <h3 className="text-lg font-medium">{group.title}</h3>
                <SectionBody className="mt-2 text-base">
                  <p>{group.body}</p>
                </SectionBody>
              </li>
            ))}
          </ul>
        </CapturedContextScrollSpy>
      </div>
    </section>
  );
}
