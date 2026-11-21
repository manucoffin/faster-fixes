import Link from "next/link";
import { SectionBody } from "../../../features/_components/section-body";
import { VsFitList } from "../../_features/vs-fit-list";
import { VsSection } from "../../_features/vs-section";

const markerIoFitPoints = [
  "Reviewers need a Chrome, Firefox or Safari extension to comment on sites you cannot add a script to.",
  "You review Figma designs, PDFs or images, not only live pages.",
  "Clients need a Guest Portal to follow their reports.",
  "Your backlog lives in Asana, ClickUp or Monday.com.",
  "You need SSO on a Business plan.",
];

const fasterFixesFitPoints = [
  "You want an open-source tool you can self-host for data control or compliance.",
  "Your team grows and you do not want to pay per seat.",
  "You want Claude Code, Cursor or Codex to read and resolve feedback over MCP.",
  "Your developers need the DOM selector, component path, console and network logs on every plan.",
  "You work in GitHub, Linear, Jira or Trello and want status to sync both ways.",
];

export function MarkerIoFitSection() {
  return (
    <VsSection
      eyebrow="Fit"
      title="Marker.io or FasterFixes: which one to pick"
      intro="Marker.io suits QA and project teams that collect feedback across live sites, designs and documents. FasterFixes suits developer teams that ship and fix client sites themselves."
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            Pick Marker.io if
          </h3>
          <VsFitList points={markerIoFitPoints} className="mt-6" />
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
          <Link href="/blog/marker-io-alternatives">
            8 Marker.io alternatives
          </Link>{" "}
          compares the rest on pricing, free plans and self-hosting.
        </p>
      </SectionBody>
    </VsSection>
  );
}
