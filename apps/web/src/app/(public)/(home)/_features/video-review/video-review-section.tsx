import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowRightIcon,
  BotIcon,
  ClockIcon,
  SquareKanbanIcon,
} from "lucide-react";
import Link from "next/link";
import { VideoReviewAnimation } from "./video-review-animation";

const points = [
  {
    Icon: ClockIcon,
    text: "Timestamped feedback, with the area on the frame",
  },
  {
    Icon: SquareKanbanIcon,
    text: "Same board and same trackers as your site feedback",
  },
  {
    Icon: BotIcon,
    text: "Readable by your coding agent through MCP",
  },
];

export function VideoReviewSection() {
  return (
    <section id="video-review" className="w-full scroll-mt-16 py-16 md:py-24">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-start">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Video review
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Not just websites. Videos too.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Upload a video and share a link. Clients mark the exact moment, or a
            range, and point at the frame. No account needed.
          </p>

          <ul className="mt-8 flex flex-col gap-4">
            {points.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-lg">
                <Icon className="mt-1 size-5 shrink-0 text-muted-foreground" />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="mt-8">
            <Link href={signupUrl}>
              Get Started Free
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>

        <VideoReviewAnimation />
      </div>
    </section>
  );
}
