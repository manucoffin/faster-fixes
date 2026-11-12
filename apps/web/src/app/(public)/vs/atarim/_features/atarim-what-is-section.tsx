export function AtarimWhatIsSection() {
  return (
    <section className="w-full py-16 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Background
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">What is Atarim?</h2>
        </div>

        <div className="mt-8 space-y-4 text-lg leading-relaxed">
          <p>
            Atarim (formerly WP Feedback) was founded in 2019 by Vito Peleg in
            London. It is a cloud-based visual collaboration platform used by
            72,000+ teams and 1.7 million users, primarily web design agencies,
            freelancers, and WordPress professionals managing client review
            cycles.
          </p>
          <p>
            The platform centers on point-and-click visual feedback on live
            websites, with a suite of six AI agents called InnerCircle built
            into the dashboard: Claro (project management), Pixel (design), Lexi
            (content), Index (SEO and performance), Navi (UX and accessibility),
            and Glitch (functionality). It supports client portals with guest
            access, whitelabeling, integrations with Jira, Asana, ClickUp,
            Monday.com, Slack, Trello, Basecamp, Teamwork, Figma, Zapier, and
            more, and a free MCP server that connects Claude, Codex, and other
            AI clients to Atarim tasks and sites.
          </p>
          <p>
            Atarim is proprietary and cloud-only. There is no self-hosting
            option and no public source code. It sells one paid plan: Pro at
            $67/month, or $53.60/month billed yearly ($643.20/year), for up to
            100 seats and 1,000 projects, with 5,000 AI credits a month. Extra
            credits cost $6 to $10 per 1,000. The free plan covers 1 project
            with 200 credits, one time, and Enterprise is priced on request.
          </p>
        </div>
      </div>
    </section>
  );
}
