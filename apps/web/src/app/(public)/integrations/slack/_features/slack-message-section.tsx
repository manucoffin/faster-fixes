import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const contents = [
  {
    title: "Reviewer and page",
    body: "Who submitted the feedback and the exact page URL they were on, so you know whose report it is and where to look without asking.",
  },
  {
    title: "Comment and screenshot",
    body: "The reviewer's comment and the captured screenshot, posted inline as an image block. The report reads in full without leaving Slack.",
  },
  {
    title: "Status badge and deep link",
    body: "A badge showing the current status and an Open in Faster Fixes link that jumps straight to the item, where the full diagnostic trail lives.",
  },
];

export function SlackMessageSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            What lands in every Slack message
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Enough context to triage without opening the dashboard
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Each notification carries the reviewer, the page, the comment, and
            the screenshot. The team can decide what to do with a report
            straight from the channel.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {contents.map((item) => (
            <Card key={item.title} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {item.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
