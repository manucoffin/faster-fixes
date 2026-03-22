import { APP_URL } from "@/app/_constants/app";
import { signupUrl } from "@/app/_constants/routes";
import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import { OrganizationSchema } from "@/app/_features/seo/organization-schema";
import { WebSiteSchema } from "@/app/_features/seo/website-schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowRightIcon,
  CameraIcon,
  ClipboardListIcon,
  CodeIcon,
  MessageSquareIcon,
  MonitorSmartphoneIcon,
  MousePointerClickIcon,
  SmartphoneIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_META_DESCRIPTION,
  alternates: {
    canonical: APP_URL,
  },
};

export default function Page() {
  return (
    <div>
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <BenefitsSection />
      <BeforeAfterSection />
      <FaqSection />
      <FinalCtaSection />

      <OrganizationSchema />
      <WebSiteSchema />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section className="w-full py-24 md:py-32">
      <div className="container mx-auto flex flex-col items-center px-4 text-center">
        <Badge variant="outline" className="mb-6">
          Free plan available
        </Badge>

        <h1 className="max-w-3xl text-4xl leading-tight font-bold md:text-5xl lg:text-6xl">
          Turn messy client feedback into clear developer tasks
        </h1>

        <p className="text-muted-foreground mt-6 max-w-2xl text-lg md:text-xl">
          Your clients leave feedback directly on the website. FasterFixes
          captures the context and turns it into structured, dev-ready tasks.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg">
            <Link href={signupUrl}>
              Get Started Free
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Problem
// ---------------------------------------------------------------------------

const painPoints = [
  {
    icon: SmartphoneIcon,
    title: "WhatsApp threads",
    description:
      "Dozens of comments buried in a chat. No link to the page, no screenshot, no priority.",
  },
  {
    icon: MessageSquareIcon,
    title: "Scattered Slack messages",
    description:
      "Feedback spread across channels and DMs. Half the context is missing by the time you read it.",
  },
  {
    icon: CameraIcon,
    title: "Phone photos of screens",
    description:
      'A blurry photo with "can you fix this?" — no URL, no browser info, no way to reproduce.',
  },
];

function ProblemSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Client feedback shouldn&apos;t be a scavenger hunt
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            You know the drill. A client sends a wall of text on WhatsApp, a few
            blurry screenshots, and a vague &quot;the button doesn&apos;t
            work.&quot; You spend more time decoding the feedback than fixing the
            issue.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className="bg-background flex flex-col gap-3 rounded-lg border p-6"
            >
              <point.icon className="text-muted-foreground size-6" />
              <h3 className="font-semibold">{point.title}</h3>
              <p className="text-muted-foreground text-sm">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const steps = [
  {
    number: "1",
    icon: MousePointerClickIcon,
    title: "Client clicks on the page",
    description:
      "A lightweight widget lets your client click anywhere on the website and leave feedback. No account needed.",
  },
  {
    number: "2",
    icon: MonitorSmartphoneIcon,
    title: "Context is captured automatically",
    description:
      "Screenshot, page URL, browser, viewport, and timestamp — all collected without the client lifting a finger.",
  },
  {
    number: "3",
    icon: ClipboardListIcon,
    title: "You get a structured task",
    description:
      "Every piece of feedback lands in your dashboard as a clear, actionable task. Copy it as Markdown, send it to your issue tracker, or let an AI agent handle it.",
  },
];

function HowItWorksSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Three steps from feedback to fix
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            No onboarding call. No training your client. Drop in the widget and
            start collecting feedback in minutes.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col gap-4">
              <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full text-sm font-bold">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Benefits
// ---------------------------------------------------------------------------

const benefits = [
  {
    icon: MousePointerClickIcon,
    title: "Zero friction for clients",
    description:
      "No login, no training, no new tool to learn. Clients click, comment, and move on. The widget handles the rest.",
  },
  {
    icon: CodeIcon,
    title: "Built for developers",
    description:
      "Every feedback item includes the technical context you need — URL, screenshot, browser, viewport. Export as Markdown or connect to your existing workflow.",
  },
  {
    icon: ClipboardListIcon,
    title: "AI-structured tasks",
    description:
      "Raw client comments are transformed into clear, categorized developer tasks. Summaries, priorities, and action items — ready for your issue tracker or coding agent.",
  },
];

function BenefitsSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Feedback that&apos;s already half the fix
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            When every feedback item arrives with full context, you skip the
            back-and-forth and go straight to shipping.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col gap-3">
              <benefit.icon className="text-primary size-8" />
              <h3 className="text-lg font-semibold">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Before / After
// ---------------------------------------------------------------------------

const beforeItems = [
  "Client sends a WhatsApp message with 12 bullet points",
  "You re-read it three times to understand what they mean",
  "You open the app and try to find the right page",
  "You screenshot the issue yourself for the ticket",
  "You write a task in Linear from memory",
];

const afterItems = [
  "Client clicks the element and types a comment",
  "FasterFixes captures the screenshot, URL, and metadata",
  "The feedback appears in your dashboard as a structured task",
  "You copy it to your issue tracker or let an AI agent process it",
];

function BeforeAfterSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            The workflow you have vs. the one you want
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-lg border p-6">
            <h3 className="text-muted-foreground mb-4 text-sm font-semibold uppercase tracking-wider">
              Without FasterFixes
            </h3>
            <ul className="flex flex-col gap-3">
              {beforeItems.map((item) => (
                <li
                  key={item}
                  className="text-muted-foreground flex gap-3 text-sm"
                >
                  <span className="text-muted-foreground/50 mt-0.5 shrink-0">
                    &mdash;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-primary/20 bg-primary/5 rounded-lg border p-6">
            <h3 className="text-primary mb-4 text-sm font-semibold uppercase tracking-wider">
              With FasterFixes
            </h3>
            <ul className="flex flex-col gap-3">
              {afterItems.map((item, index) => (
                <li key={item} className="flex gap-3 text-sm">
                  <span className="text-primary mt-0.5 shrink-0 font-medium">
                    {index + 1}.
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const faqs = [
  {
    question: "How does the widget work?",
    answer:
      "You add a small script tag to your website. Your client can then click anywhere on the page to leave a comment. The widget captures a screenshot, the page URL, browser info, and viewport size automatically.",
  },
  {
    question: "Do my clients need an account?",
    answer:
      "No. Clients can leave feedback without signing up or logging in. The goal is zero friction — they click, comment, and move on.",
  },
  {
    question: "What does the AI do exactly?",
    answer:
      "The AI reads raw client comments and transforms them into structured developer tasks. It summarizes the feedback, categorizes the type of issue (bug, UI tweak, content change), and produces clear action items you can send to your issue tracker.",
  },
  {
    question: "Can I connect FasterFixes to my existing tools?",
    answer:
      "Yes. You can export feedback as Markdown, and we are building integrations with tools like Linear, GitHub Issues, and Jira. API and webhook support are on the roadmap.",
  },
  {
    question: "How much does it cost?",
    answer:
      "FasterFixes has a free plan so you can try it on a real project. Paid plans start at an accessible price point designed for small agencies and freelancers — not enterprise budgets.",
  },
  {
    question: "Is this just another annotation tool?",
    answer:
      "No. Annotation tools let clients highlight things on a page. FasterFixes goes further — it captures full technical context and uses AI to turn raw feedback into structured, dev-ready tasks. The output is what matters.",
  },
];

function FaqSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
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
                  <p className="text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

function FinalCtaSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Stop decoding feedback. Start shipping fixes.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Set up FasterFixes on your next project in under 5 minutes. Free
            plan included, no credit card required.
          </p>

          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Get Started Free
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
