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
    title: "Page and element context",
    body: (
      <>
        The page URL. The CSS selector of the clicked element, generated with
        fallback strategies. The click coordinates, the element&apos;s position
        and size, and the viewport size. The inbox draws the Selection frame
        over the Screenshot, so a comment stays tied to the element it is about.
      </>
    ),
  },
  {
    key: "browser",
    title: "Browser, OS and Screenshot",
    body: (
      <>
        The browser name and version, and the operating system. A full-page
        Screenshot is taken at submission, with the widget&apos;s own UI left
        out of the image.
      </>
    ),
  },
  {
    key: "components",
    title: "React component tree",
    body: (
      <>
        On React sites running development builds, the Feedback also carries the
        React component tree and the source file behind the selected element.
      </>
    ),
  },
  {
    key: "diagnostics",
    title: "The Diagnostic Trail",
    body: (
      <>
        The last 50 console entries, covering log, info, warn, error and debug,
        with each message capped at 2 KB. The last 50 network requests made with
        fetch or XMLHttpRequest, with method, URL, status and duration.
        Sensitive query parameters, such as token, api key, password, session,
        email or jwt, are redacted from captured URLs. Set{" "}
        <code>captureDiagnostics</code> to <code>false</code> to turn the
        Diagnostic Trail off.
      </>
    ),
  },
  {
    key: "metadata",
    title: "Custom metadata",
    body: (
      <>
        Your site can attach key/value pairs: a user ID, a tenant, a release
        version, a feature flag. Up to 50 keys, with values as string, number,
        boolean or null.{" "}
        <Link href={"/docs/widget/custom-metadata" as Route}>
          Custom metadata
        </Link>{" "}
        shows how to attach them.
      </>
    ),
  },
];

export function ActionableBugReportsCapturedContext() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>What every Feedback carries</SectionHeading>
        <p className="mt-4 max-w-3xl text-xl leading-snug tracking-tight text-pretty text-muted-foreground md:text-2xl">
          All of it is captured at submission. The Reviewer fills in nothing.
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
