import { VideoIcon } from "lucide-react";
import { SectionBody } from "../../../features/_components/section-body";
import { SectionHeading } from "../../../features/_components/section-heading";
import { TrelloCardTrail } from "../_components/trello-card-trail.client";

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
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          Every Trello card arrives with the full diagnostic trail
        </SectionHeading>
        <p className="mt-4 max-w-3xl text-xl leading-snug tracking-tight text-pretty text-muted-foreground md:text-2xl">
          Most feedback tools drop a title and a link on the board. Faster Fixes
          writes the context a developer needs into the card itself.
        </p>

        <TrelloCardTrail items={cardContents} />

        <div className="mt-12 flex max-w-3xl gap-4">
          <VideoIcon
            aria-hidden
            className="mt-1.5 size-5 shrink-0 text-muted-foreground"
          />
          <SectionBody>
            <p>
              <span className="text-foreground">
                Feedback left on a Video is mirrored the same way,
              </span>{" "}
              with a link to the Video in the dashboard. The share link you send
              your client never appears on the card.
            </p>
          </SectionBody>
        </div>
      </div>
    </section>
  );
}
