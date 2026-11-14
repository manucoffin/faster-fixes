export function ActionableBugReportsIntro() {
  return (
    <section className="w-full border-y py-20 md:py-28">
      <div className="container mx-auto px-4">
        <p className="max-w-4xl text-2xl leading-snug font-normal tracking-tight text-pretty text-muted-foreground md:text-3xl md:leading-snug">
          <span className="text-foreground">
            &quot;The form is broken.&quot; Which form, on which page, in which
            browser?
          </span>{" "}
          Clients and project managers describe what they see, not what a
          developer needs, and every vague ticket turns into a round of
          questions before anyone can fix it.{" "}
          <span className="text-foreground">
            With Faster Fixes, the client clicks the element and writes one
            sentence. The report arrives with the page, the element, the
            screenshot, the logs and a replay of what they did.
          </span>
        </p>
      </div>
    </section>
  );
}
