import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const cardContents = [
  {
    title: "The comment, where it was left",
    body: "The client's comment, the page URL and the CSS selector of the element they clicked, so you land on the right spot without asking a follow-up question.",
  },
  {
    title: "The screenshot as the card cover",
    body: "The screenshot is attached to the card as a file and set as its cover. You recognize the card on the board at a glance, and the image never expires.",
  },
  {
    title: "Console logs and network requests",
    body: "The Diagnostic Trail captured before submission: console errors, failed network requests and the client's steps. A very long trail is cut to fit, with the dashboard link kept.",
  },
  {
    title: "A link to the Recording",
    body: "When the feedback has a Recording, the card links to its player in the dashboard. An automatic card waits for the Recording, and a late one is added to the card when it arrives.",
  },
  {
    title: "Browser, viewport and reviewer",
    body: "The browser and OS, the viewport size and the reviewer's name, so a layout bug on a small screen is reproducible on the first try.",
  },
  {
    title: "Custom metadata and the dashboard link",
    body: "Any metadata your widget sends, such as a user ID or a build number, plus a link back to the full feedback in Faster Fixes.",
  },
];

export function TrelloCardSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Trello bug tracking
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Every Trello card arrives with the full diagnostic trail
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most feedback tools drop a title and a link on the board. Faster
            Fixes writes the context a developer needs into the card itself.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cardContents.map((item) => (
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

        <p className="mx-auto mt-10 max-w-2xl text-center text-muted-foreground">
          Feedback left on a Video is mirrored the same way, with a link to the
          Video in the dashboard. The share link you send your client never
          appears on the card.
        </p>
      </div>
    </section>
  );
}
