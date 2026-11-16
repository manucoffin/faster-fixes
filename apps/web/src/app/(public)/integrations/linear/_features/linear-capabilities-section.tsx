import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import type { Route } from "next";
import Link from "next/link";

const capabilities = [
  {
    title: "Status sync that survives renames and custom states",
    body: "Status changes flow both ways between Faster Fixes and Linear. The mapping handles renamed and custom workflow states automatically, so it keeps working as your team's process evolves.",
  },
  {
    title: "Issues created with the data engineers actually need",
    body: "When a client submits feedback, Faster Fixes opens a Linear issue in the linked team. The body contains the annotated screenshot, page URL, CSS selector, React component path, source file, click coordinates, browser/OS/viewport, a link to replay the last minute on the page, and a timeline of the client's steps, console logs and network requests before submission.",
  },
  {
    title: "Track the Linear identifier without leaving Faster Fixes",
    body: "Once an issue is created, the Faster Fixes inbox shows a Linear badge: the identifier (e.g. ENG-123) and a colored dot reflecting the issue's current state. The integration is independent of the others: a feedback item can be linked to Linear, GitHub, Jira, Trello, any combination, or none.",
  },
];

export function LinearCapabilitiesSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            What lands in every Linear issue
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Every issue arrives with full context attached
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The integration goes beyond creating a title and a link. Each Linear
            issue carries the data your engineers need to reproduce and fix the
            bug without a follow-up conversation.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{capability.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {capability.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-muted-foreground">
          Part of the team plans on a board? The{" "}
          <Link
            href={"/integrations/trello" as Route}
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            Trello integration
          </Link>{" "}
          mirrors the same feedback as a card, and its status stays in sync with
          the Linear issue.
        </p>
      </div>
    </section>
  );
}
