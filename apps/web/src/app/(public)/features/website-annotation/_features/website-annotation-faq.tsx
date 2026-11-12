import type { FaqItem } from "@/app/_components/seo/faq-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { SectionHeading } from "../_components/section-heading";

export const websiteAnnotationFaqs: FaqItem[] = [
  {
    question: "Is a website annotation tool the same thing as a feedback tool?",
    answer:
      "Not in the usual sense. A canvas annotator marks up a screenshot and gives you back an image, and someone still has to translate it. Here the client's click, comment and all the technical context become one structured item, which is why the same tool serves as a feedback tool for a build review and as input for an agent.",
  },
  {
    question: "Does masking cover the screenshot?",
    answer:
      "No. The Screenshot still shows what is typed into fields and the text of data-ff-mask elements. Only data-ff-block removes an element from it. Masking is a property of the Recording, so anything that must not appear in the image has to be blocked with an attribute.",
  },
  {
    question: "Can I self-host the whole stack?",
    answer:
      "Yes. The app is AGPL-3.0 and the widget packages are MIT, so self-hosting has no licence fee and no per-seat charge: you pay only for the host, the database, storage and email. A self-hosted instance resolves to the Agency plan, with every feature and integration unlocked.",
  },
  {
    question: "Which sites and frameworks does the widget support?",
    answer:
      "Any site. One script tag covers WordPress, Webflow and static HTML. There are packages for React and Next.js, Vue and Nuxt, Angular, Svelte and SvelteKit, and snippets for Astro, Solid, Preact and vanilla JavaScript. Every path mounts the same widget and captures the same context.",
  },
  {
    question: "Is the website annotation tool free to try?",
    answer:
      "Yes, and the Free plan is not time-limited: 1 project, up to 20 feedback items, 1 team member, 1 video up to 500 MB, the widget, the replay of the last minute before each feedback, and the feedback dashboard. The MCP server works on all plans, including Free. GitHub, Linear, Jira and Slack need Pro at $20/month flat for up to 5 members, or Agency at $99/month with unlimited members. Your data is never deleted when a plan ends.",
  },
];

export function WebsiteAnnotationFaq() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 gap-10 px-4 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <SectionHeading className="lg:sticky lg:top-24 lg:self-start">
          Frequently asked questions
        </SectionHeading>

        <Accordion type="single" collapsible className="border-t">
          {websiteAnnotationFaqs.map((faq) => (
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
