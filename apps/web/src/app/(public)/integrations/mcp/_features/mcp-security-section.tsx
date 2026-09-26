import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import type { Route } from "next";
import Link from "next/link";

const guarantees = [
  {
    title: "Scoped per capability",
    body: "Read, update, and create are separate permissions on the agent token. Grant only what the agent needs; no delete or admin operations are exposed through the MCP server.",
  },
  {
    title: "Revoke instantly",
    body: "Tokens are revoked from the dashboard with no redeploy. If a token leaks or an agent misbehaves, you cut access in one click.",
  },
  {
    title: "Capped and rate-limited",
    body: "Bulk creates are rate-limited and stop at your plan's feedback limit, so a runaway agent can't flood your project.",
  },
];

export function McpSecuritySection() {
  return (
    <section className="w-full bg-muted/50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Token scopes and security
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            You decide what the agent can touch
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {guarantees.map((item) => (
            <Card key={item.title} className="bg-background">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {item.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-muted-foreground">
          Full details in the{" "}
          <Link
            href={"/docs/concepts/agent-tokens" as Route}
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            agent tokens docs
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
