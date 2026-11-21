import Link from "next/link";
import { SectionBody } from "../../../features/_components/section-body";
import { VsFitList } from "../../_features/vs-fit-list";
import { VsSection } from "../../_features/vs-section";

const bugherdFitPoints = [
  "Reviewers need a Chrome extension to comment on sites you cannot add a script to.",
  "Clients need their own task board to follow progress.",
  "You review Figma designs, PDFs or images, not only live pages.",
  "You want screen-recorded video feedback.",
  "You need SSO, custom branding, or Asana, ClickUp and Monday.com integrations.",
];

const fasterFixesFitPoints = [
  "You want an open-source tool you can self-host for data control or compliance.",
  "Your team grows and you do not want to pay per seat.",
  "You want Claude Code, Cursor or Codex to read and resolve feedback over MCP.",
  "Your developers need the DOM selector, component path, console and network logs behind each report.",
  "You work in GitHub, Linear, Jira or Trello and want status to sync both ways.",
];

export function BugherdFitSection() {
  return (
    <VsSection
      eyebrow="Fit"
      title="BugHerd or FasterFixes: which one to pick"
      intro="BugHerd suits QA-led teams and project managers who run client review on a kanban board. FasterFixes suits developer teams that ship and fix client sites themselves."
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            Pick BugHerd if
          </h3>
          <VsFitList points={bugherdFitPoints} className="mt-6" />
        </div>
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            Pick FasterFixes if
          </h3>
          <VsFitList points={fasterFixesFitPoints} className="mt-6" />
        </div>
      </div>
      <SectionBody className="mt-12 max-w-2xl">
        <p>
          If neither fits, our{" "}
          <Link href="/blog/bugherd-alternatives">9 BugHerd alternatives</Link>{" "}
          ranks the rest on real per-team pricing.
        </p>
      </SectionBody>
    </VsSection>
  );
}
