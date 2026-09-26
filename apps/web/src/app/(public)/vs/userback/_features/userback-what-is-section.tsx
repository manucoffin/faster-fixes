export function UserbackWhatIsSection() {
  return (
    <section className="w-full py-16 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Background
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">What is Userback?</h2>
        </div>

        <div className="mt-8 space-y-4 text-lg leading-relaxed">
          <p>
            Userback is a cloud-hosted user feedback platform founded in 2016
            and used by 20,000+ product teams. It captures visual feedback,
            annotated video, and session replay from end users, and centralizes
            it in a dashboard for product managers, designers, and developers.
          </p>
          <p>
            The platform layers in NPS, CSAT, and CES microsurveys, AI-driven
            sentiment analysis on the Business and Business Plus tiers, and a
            public Feature Portal add-on for collecting and prioritizing feature
            requests. Integrations cover Jira, ClickUp (with two-way sync), and
            Zapier, with a JavaScript SDK and mobile SDK on paid plans.
          </p>
          <p>
            Userback is closed-source and cloud-only. There is no self-hosted
            option, and pricing is per-seat across every tier (Team $9, Business
            $19, Business Plus $29 monthly). It is built primarily for SaaS
            product teams collecting end-user feedback at scale, not for
            developer teams running structured bug-fix workflows.
          </p>
        </div>
      </div>
    </section>
  );
}
