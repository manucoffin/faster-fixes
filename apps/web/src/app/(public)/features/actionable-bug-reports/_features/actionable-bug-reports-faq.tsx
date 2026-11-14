import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { SectionHeading } from "../../_components/section-heading";

export const actionableBugReportsFaqs: FaqItem[] = [
  {
    question: "What does a good bug report contain?",
    answer:
      "The page URL, the CSS selector of the clicked element, the click coordinates, the element's position and size, the viewport size, the browser name and version, the operating system, a full-page Screenshot, the React component tree on React development builds, the Diagnostic Trail, any Custom metadata the site attaches, and the Recording of the previous minute when one was captured.",
  },
  {
    question: "How does a Reviewer submit a bug report?",
    answer:
      "They open the site through a review link, click the element that looks wrong, type one sentence and submit. No account and no browser extension.",
  },
  {
    question: "Can public visitors be recorded?",
    answer:
      "No. The widget renders only for Reviewers who arrive through a review link. Public visitors never see it and are never recorded.",
  },
  {
    question: "Does the Recording capture what a Reviewer typed?",
    answer:
      "No. The value of inputs, textareas, selects and contenteditable text is never captured. The Recording shows that the Reviewer typed and where, not what.",
  },
  {
    question: "What happens if the Recording fails?",
    answer:
      "The Feedback is still submitted. Capture is best effort, and it can fail past the 4 MB compressed size cap or when a content security policy blocks it.",
  },
  {
    question: "Can I turn the Diagnostic Trail or the Recording off?",
    answer:
      "Yes. captureDiagnostics turns the Diagnostic Trail off and captureRecording turns the Recording off. To hide parts of a page, use data-ff-mask and data-ff-block, as the Recording documentation describes.",
  },
  {
    question: "Which frameworks and CMSs can I install the widget on?",
    answer:
      "Packages for React and Next.js, Vue and Nuxt, Angular, Svelte and SvelteKit. A script tag for WordPress, Webflow and static HTML. Snippets for Astro, Solid, Preact and vanilla JavaScript.",
  },
  {
    question: "Is Faster Fixes free, and is it open source?",
    answer:
      "The Free plan is not time-limited and the MCP server works on every plan. The app is AGPL-3.0, the widget packages are MIT, and a self-hosted install resolves to the Agency plan.",
  },
];

export function ActionableBugReportsFaq() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <SectionHeading className="lg:sticky lg:top-24 lg:self-start">
          Frequently asked questions
        </SectionHeading>

        <Accordion type="single" collapsible className="border-t">
          {actionableBugReportsFaqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="py-5 text-lg md:text-xl">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="max-w-2xl text-lg leading-relaxed text-pretty text-muted-foreground">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
