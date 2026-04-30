const atarimWins = [
  "Whitelabel on Enterprise: custom logo, favicon, color scheme, plugin name, and removal of all Atarim branding. FasterFixes has no whitelabel option.",
  "Client portal: clients can log in with their own account or access via a shared guest link without an account. FasterFixes has no dedicated client portal.",
  "WordPress-native: deep WordPress integration via a dedicated plugin, used by 72,000+ teams. FasterFixes has no WordPress plugin.",
  "AI InnerCircle: six specialized AI agents — design (Pixel), copy (Claro), SEO (Lexi), UX (Index), clarity (Navi), and QA (Glitch) — built into the platform.",
  "Broad PM integrations out of the box: Jira, Asana, ClickUp, Monday.com, Trello, Basecamp, Teamwork, Slack, Figma, Zapier, Pabbly, Make, and more.",
  "Chrome extension: works on any website without installing a widget or touching code. Useful for reviewing third-party or live production sites.",
];

export function AtarimHonestTakeSection() {
  return (
    <section className="bg-muted/30 w-full border-y py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Honest take
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Atarim is the better choice for some teams
          </h2>
        </div>

        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-left text-lg">
          Atarim is a mature platform with genuine strengths. If any of the
          points below describe your workflow, Atarim is the more complete fit
          today.
        </p>

        <ul className="text-muted-foreground mx-auto mt-8 max-w-2xl list-disc space-y-2 pl-6 text-lg leading-relaxed">
          {atarimWins.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
