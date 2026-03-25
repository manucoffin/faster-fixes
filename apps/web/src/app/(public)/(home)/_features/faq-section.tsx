import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";

const faqs = [
  {
    question: "How does the widget work?",
    answer:
      "Install the React component in your app. Your clients leave feedback in two clicks — the widget captures all the technical context automatically. You review feedback in the dashboard, or your coding agent retrieves it via MCP and fixes it directly.",
  },
  {
    question: "Do my clients need an account?",
    answer:
      "No. You generate a shareable link for each client from your dashboard. Anyone with that link can leave feedback — they are authenticated transparently, no signup or login required. It keeps things secure while staying completely frictionless for your clients.",
  },
  {
    question: "What technical context does it capture?",
    answer:
      "Screenshot, page URL, DOM selector, element description, React component tree (when available), browser name and version, viewport dimensions, and timestamp. All captured automatically when the client clicks.",
  },
  {
    question: "What is the MCP server?",
    answer:
      "MCP (Model Context Protocol) is a standard that lets AI coding agents call external tools. The FasterFixes MCP server exposes your project's feedback to any compatible agent — Claude Code, Cursor, Windsurf, and others. The agent can fetch new feedback and mark items as resolved, all from your terminal.",
  },
  {
    question: "How does the GitHub integration work?",
    answer:
      "Connect your GitHub account in the organization settings, then link a repository to your project. New feedback automatically creates a GitHub issue with the full structured report — screenshot, component path, selector, and environment details. Status syncs bidirectionally: closing an issue on GitHub resolves the feedback in FasterFixes, and vice versa. Available on Pro and Agency plans.",
  },
  {
    question: "Is this just another annotation tool?",
    answer:
      "Annotation tools improve how clients give feedback. FasterFixes improves what arrives on the developer's side. The output is a structured markdown report with full technical context — not a pin on a screenshot. It is designed to be consumed by AI coding agents, not just read by humans.",
  },
  {
    question: "How much does it cost?",
    answer:
      "The Free plan covers 1 project with up to 50 feedback items — ideal for testing or solo use. The Pro plan is $20/month for up to 5 projects, unlimited feedback, and 5 team members — designed for freelancers and small teams managing multiple client projects. The Agency plan is $90/month with unlimited projects, feedback, and team members — built for agencies with many concurrent projects and larger teams.",
  },
  {
    question: "Which frameworks are supported?",
    answer:
      "The widget is currently available as a React component (@fasterfixes/react) and works with Next.js and any React-based framework. Support for other frameworks is on the roadmap.",
  },
];

export function FaqSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <Accordion type="single" collapsible>
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-muted-foreground text-lg md:text-xl">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
