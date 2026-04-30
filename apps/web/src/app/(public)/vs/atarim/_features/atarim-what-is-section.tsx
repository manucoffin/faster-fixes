export function AtarimWhatIsSection() {
  return (
    <section className="w-full py-16 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Background
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">What is Atarim?</h2>
        </div>

        <div className="mt-8 space-y-4 text-lg leading-relaxed">
          <p>
            Atarim (formerly WP Feedback) was founded in 2019 by Vito Peleg in
            London. It is a cloud-based visual collaboration platform used by
            72,000+ teams and 1.7 million users — primarily web design
            agencies, freelancers, and WordPress professionals managing client
            review cycles.
          </p>
          <p>
            The platform centers on point-and-click visual feedback on live
            websites, with a suite of six AI agents called InnerCircle — Pixel
            (design), Claro (copy), Lexi (SEO), Index (UX), Navi (clarity),
            and Glitch (QA) — built into the dashboard. It supports client
            portals with guest access, whitelabeling, and integrations with
            Jira, Asana, ClickUp, Monday.com, Slack, Trello, Basecamp,
            Teamwork, Figma, Zapier, and more.
          </p>
          <p>
            Atarim is proprietary, cloud-only, and priced per seat. There is
            no self-hosting option and no public source code. The Pro plan
            starts at $25/seat/month (billed yearly), which means a 5-person
            team pays $125/month — $1,500/year — before hitting the 5-seat
            cap and upgrading to Business at $35/seat/month.
          </p>
        </div>
      </div>
    </section>
  );
}
