import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const capabilities = [
  {
    title: "The same message updates in place",
    body: "When a feedback item moves from new to in progress to resolved, Faster Fixes edits the original Slack message rather than posting a new one. The channel stays one message per report, no cascade of status-change notifications to scroll past.",
  },
  {
    title: "An agent-resolved badge",
    body: "When an AI coding agent resolves feedback through the MCP server, the message updates to a 🤖 Resolved by agent badge. Your team can see at a glance which fixes were handled automatically and which were closed by a person.",
  },
  {
    title: "One channel per project, no firehose",
    body: "Each project posts to its own channel, so feedback from different clients stays isolated instead of piling into one shared stream. Switch a project's channel or pause posting at any time without touching the others.",
  },
];

export function SlackUpdatesSection() {
  return (
    <section className="w-full border-y bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Notifications that stay clean
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            A live message, not a stream of alerts
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most tools post a fresh Slack message for every event. Faster Fixes
            keeps a single message per piece of feedback and updates it as the
            status changes.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="bg-background">
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
