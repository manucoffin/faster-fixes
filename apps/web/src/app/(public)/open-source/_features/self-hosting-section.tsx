import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

const steps = [
  {
    label: "Deploy the repo",
    body: "Push to Vercel, Railway, Fly, or any Node host. The repo is a standard Next.js + Turborepo workspace.",
  },
  {
    label: "Provision services",
    body: "Point to a Postgres database, an Inngest app for background jobs, and a Cloudflare R2 or S3-compatible bucket for screenshots.",
  },
  {
    label: "Set environment variables",
    body: "Copy apps/web/.env.example and fill in the values. Add a Resend or Plunk key for sign-up emails. Stripe is cloud-only and stays unset.",
  },
  {
    label: "Run migrations",
    body: "pnpm --filter @workspace/db migrate:dev applies the schema. Production deploys run prisma migrate deploy as part of your build.",
  },
];

export function SelfHostingSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Self-hosting
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Self-host FasterFixes in four steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Same stack as the hosted version. No proprietary binaries, no hidden
            services.
          </p>
        </div>

        <ol className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {steps.map((step, i) => (
            <li
              key={step.label}
              className="flex gap-4 rounded-xl border bg-background p-6"
            >
              <span className="font-mono text-sm text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="font-semibold">{step.label}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href={"/docs/self-hosting" as Route}>
              Full self-hosting guide
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already on GitHub? Pair the self-hosted dashboard with the{" "}
          <Link
            href={"/integrations/github" as Route}
            className="text-foreground underline underline-offset-4 hover:no-underline"
          >
            GitHub integration
          </Link>{" "}
          to push every feedback item straight into your repo as an issue.
        </p>
      </div>
    </section>
  );
}
