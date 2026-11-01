import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  PLAN_LIMITS,
  PLAN_PRICES,
  SubscriptionPlanName,
} from "@/app/_domains/subscription";
import type { Route } from "next";
import Link from "next/link";

type OpenSourceFaq = FaqItem & {
  links?: { href: Route; label: string }[];
};

const proPlan = PLAN_LIMITS[SubscriptionPlanName.Pro];
const freePlan = PLAN_LIMITS[SubscriptionPlanName.Free];

export const openSourceFaqs: OpenSourceFaq[] = [
  {
    question: "Is FasterFixes open source?",
    answer:
      "Yes. The full source is public on GitHub. The app, which includes the dashboard, the widget API and the agent API, is licensed under AGPL-3.0. The widget packages and the MCP server are published to npm under the MIT license.",
  },
  {
    question:
      "Does the AGPL license affect the sites where I install the widget?",
    answer:
      "No. The AGPL-3.0 covers the FasterFixes app: if you run a modified version as a network service, you must make its source available to its users under the same license. The packages that load on your sites are MIT: @fasterfixes/widget, @fasterfixes/core, @fasterfixes/react, @fasterfixes/vue, @fasterfixes/angular and @fasterfixes/svelte. Embedding them carries no AGPL obligation.",
  },
  {
    question: "How much does it cost to self-host FasterFixes?",
    answer:
      "The software is free, with no license fee and no per-seat charge. You pay only for the services it runs on: a Node.js host, a PostgreSQL database, an Inngest account for background jobs, file storage and an email provider. The Inngest free tier is enough to get started, and screenshots can be stored on local disk instead of a bucket.",
    links: [
      { href: "/docs/self-hosting" as Route, label: "Self-hosting guide" },
    ],
  },
  {
    question: "Is any feature missing from the self-hosted version?",
    answer:
      "No feature is gated by plan. A self-hosted instance always resolves to the top plan, with unlimited projects, feedback and members, the white-label widget and every integration. Billing is the one part that does not run, because Stripe is used only by the hosted version.",
  },
  {
    question: "Does the MCP server work with a self-hosted instance?",
    answer:
      "Yes. @fasterfixes/mcp runs locally through npx and calls the agent API of the instance you point it at. Set FASTER_FIXES_URL to your domain, along with an agent token and a project public ID. It works with Claude Code, Cursor, Windsurf, VS Code, Codex and Zed. Your coding agent can list feedback with its full technical context, update its status, and import feedback exported from another tool.",
    links: [
      { href: "/docs/mcp/setup" as Route, label: "MCP setup" },
      { href: "/docs/mcp/tools" as Route, label: "MCP tool reference" },
    ],
  },
  {
    question: "Should I self-host or use the hosted version?",
    answer: `Use the hosted version if you would rather not run infrastructure. The Free plan covers ${freePlan.projects} project and ${freePlan.feedbacks} feedback items, Pro is $${PLAN_PRICES[SubscriptionPlanName.Pro]}/month for up to ${proPlan.seats} members and ${proPlan.projects} projects, and Agency is $${PLAN_PRICES[SubscriptionPlanName.Agency]}/month with no limit on projects, feedback or members. Self-host if you want feedback stored on infrastructure you control, or if you plan to modify the code. Both run the same codebase.`,
    links: [{ href: "/pricing", label: "Hosted pricing" }],
  },
];

export function OpenSourceFaqSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            FAQ
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        {/* Rendered open, not in an accordion: closed Radix accordion items
            are absent from the server HTML, and the FAQPage schema must match
            visible text. */}
        <div className="mx-auto mt-12 flex max-w-2xl flex-col divide-y">
          {openSourceFaqs.map((faq) => (
            <div key={faq.question} className="py-6 first:pt-0 last:pb-0">
              <h3 className="text-lg font-semibold md:text-xl">
                {faq.question}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {faq.answer}
              </p>
              {faq.links && (
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {faq.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-foreground underline underline-offset-4 hover:no-underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
