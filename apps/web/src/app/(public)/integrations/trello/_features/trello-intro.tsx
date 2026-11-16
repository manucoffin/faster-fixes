export function TrelloIntro() {
  return (
    <section className="w-full border-y py-20 md:py-28">
      <div className="container mx-auto px-4">
        <p className="max-w-4xl text-2xl leading-snug font-normal tracking-tight text-pretty text-muted-foreground md:text-3xl md:leading-snug">
          A client writes &ldquo;the button is broken&rdquo; and nobody knows
          which page, which browser or what happened before.{" "}
          <span className="text-foreground">
            Faster Fixes turns each piece of feedback into a Trello card with
            the page, the screenshot and the logs attached, and keeps its list
            in sync with the feedback status.
          </span>
        </p>
      </div>
    </section>
  );
}
