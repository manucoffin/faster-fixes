export function WebsiteAnnotationIntro() {
  return (
    <section className="w-full border-y py-20 md:py-28">
      <div className="container mx-auto px-4">
        <p className="max-w-4xl text-2xl leading-snug font-normal tracking-tight text-pretty text-muted-foreground md:text-3xl md:leading-snug">
          <span className="text-foreground">
            Faster Fixes is a website annotation tool for the teams who ship
            client sites:
          </span>{" "}
          agencies, freelancers, and developers whose stakeholder does not write
          tickets. The client opens a review link, clicks the element that looks
          wrong, writes one sentence, submits.{" "}
          <span className="text-foreground">
            Their part stops there: the report already carries the selector, the
            screenshot, the page URL, the browser, the console and network
            history and a replay of the last minute.
          </span>{" "}
          What comes next is the part a canvas tool does not give you: an
          open-source stack you can self-host, and a report your coding agent
          reads on its own.
        </p>
      </div>
    </section>
  );
}
