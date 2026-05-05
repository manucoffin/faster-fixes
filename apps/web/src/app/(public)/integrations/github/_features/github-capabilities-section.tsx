import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const capabilities = [
  {
    title: "Issues created without lifting a finger",
    body: "When a client submits feedback through the widget, a GitHub issue opens in the linked repo. No copy-pasting, no manual triage. The feedback text, page URL, and a link back to the Faster Fixes dashboard are all there from the start.",
  },
  {
    title: "Full dev context, zero follow-up questions",
    body: "The issue body contains the CSS selector, React component path, source file, click coordinates, an embedded screenshot, and the client's browser, OS, and viewport. A developer can open the issue and start working immediately.",
  },
  {
    title: "Status stays in sync, both ways",
    body: "Feedback status in Faster Fixes (new → in_progress → resolved → closed) maps directly to GitHub issue state. Close or reopen an issue in GitHub and it reflects back in Faster Fixes. A 30-second deduplication window prevents sync loops.",
  },
  {
    title: "Issue badge in your feedback inbox",
    body: "Every feedback item in the Faster Fixes inbox shows the linked issue number, its current state, and a direct link to GitHub. You always know where a piece of client feedback stands without switching tabs.",
  },
];

export function GithubCapabilitiesSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            What lands in GitHub
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Everything lands in the issue
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Client feedback, dev context, and status — synchronized between
            the Faster Fixes inbox and your GitHub repository.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{capability.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {capability.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
