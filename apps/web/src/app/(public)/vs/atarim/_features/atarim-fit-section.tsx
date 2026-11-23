import { VsFitList } from "../../_features/vs-fit-list";
import { VsSection } from "../../_features/vs-section";

const atarimFitPoints = [
  "Whitelabel: your brand replaces Atarim's on the client dashboard. FasterFixes has no whitelabel.",
  "Client portal: clients log in or follow a guest link to their own projects. FasterFixes has no portal.",
  "WordPress: you want the dedicated plugin rather than a script tag you maintain.",
  "AI agents: six agents cover project management, design, content, SEO, accessibility and functionality inside the dashboard.",
  "Tracker breadth: Jira, Asana, ClickUp, Monday.com, Trello, Basecamp and Figma are listed connections.",
];

const lookElsewherePoints = [
  "Your developers fix the bugs: a screenshot and a URL do not say which component broke.",
  "You need code context: Atarim captures the page, not the DOM selector, the console logs or the component tree.",
  "Client data stays on your infrastructure: Atarim is cloud-only, with no self-hosted build.",
  "Your own agent does the work: the Atarim MCP reaches tasks and sites, not the code behind a Feedback.",
  "You want a flat bill: AI work draws on credits billed over the plan.",
];

export function AtarimFitSection() {
  return (
    <VsSection
      eyebrow="Fit"
      title="Is Atarim the right fit for your team?"
      intro="Atarim reviews tend to agree on one thing: the platform is solid, and the bill is built around AI work you may not use. It is worth it if you want a client portal and your brand on the dashboard, not if your developers fix the bugs themselves."
    >
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="text-xl font-medium tracking-tight">Atarim fits if</h3>
          <VsFitList points={atarimFitPoints} className="mt-6" />
        </div>
        <div>
          <h3 className="text-xl font-medium tracking-tight">
            Look elsewhere if
          </h3>
          <VsFitList points={lookElsewherePoints} className="mt-6" />
        </div>
      </div>
    </VsSection>
  );
}
