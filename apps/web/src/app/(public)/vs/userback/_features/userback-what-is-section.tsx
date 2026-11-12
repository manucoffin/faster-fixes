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
            sentiment analysis on the Business and Business Plus plans, and a
            public Feature Portal for collecting and prioritizing feature
            requests, an add-on on Team and included from Business. Integrations
            cover Jira, ClickUp (with two-way sync), and Zapier, with a
            JavaScript SDK from Business and a mobile SDK on Business Plus.
          </p>
          <p>
            Userback is closed-source and cloud-only. There is no self-hosted
            option, and plans include a fixed number of seats (Team $49/month
            for 5, Business $119/month for 15, Business Plus $199/month for 25,
            monthly billing). It is built primarily for SaaS product teams
            collecting end-user feedback at scale, not for developer teams
            running structured bug-fix workflows.
          </p>
        </div>
      </div>
    </section>
  );
}
