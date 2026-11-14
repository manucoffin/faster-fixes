export function ActionableBugReportsIntro() {
  return (
    <section className="w-full border-y py-20 md:py-28">
      <div className="container mx-auto px-4">
        <p className="max-w-4xl text-2xl leading-snug font-normal tracking-tight text-pretty text-muted-foreground md:text-3xl md:leading-snug">
          <span className="text-foreground">
            Faster Fixes turns a client&apos;s one-line comment into a bug
            report a developer can act on.
          </span>{" "}
          The Reviewer clicks the element that looks wrong, types a sentence and
          submits it. What lands in your inbox already carries the page, the
          element, the browser, the Screenshot, the console output, the network
          requests and a Recording of the last minute on the page.{" "}
          <span className="text-foreground">
            Nobody has to go back and ask which page, which browser, what was
            clicked, or for a screenshot.
          </span>
        </p>
      </div>
    </section>
  );
}
