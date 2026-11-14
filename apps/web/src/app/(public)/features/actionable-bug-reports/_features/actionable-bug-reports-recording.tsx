import type { Route } from "next";
import Link from "next/link";
import { SectionBody } from "../../_components/section-body";
import { SectionHeading } from "../../_components/section-heading";
import { TypedNeverCapturedAnimation } from "../../_components/typed-never-captured-animation";
import { RecordingReplayAnimation } from "../_components/illustrations/recording-replay-animation";

export function ActionableBugReportsRecording() {
  return (
    <section className="w-full py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>
          Session replay: watch the last minute before each bug report
        </SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              <span className="text-foreground">
                Every report comes with a replay of the last minute on the page:
                the clicks, the scrolling, the pages visited, up to the element
                the client selected.
              </span>{" "}
              You see what they did instead of reading how they describe it, and
              you reproduce the bug on the first try.
            </p>
            <p>
              It attaches on its own, with no extra step for the client. The
              replay plays in the inbox next to the console and network logs, on
              the same timeline.
            </p>
          </SectionBody>

          <RecordingReplayAnimation />
        </div>

        <div className="mt-20 grid grid-cols-1 items-center gap-12 md:mt-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-xl font-medium tracking-tight">
              Sensitive data stays out of the replay
            </h3>
            <SectionBody className="mt-4">
              <p>
                What a client types in a form field is never recorded: the
                replay shows where they typed, not what. To hide more, mark any
                element to mask its text or block it entirely, as the{" "}
                <Link href={"/features/website-annotation" as Route}>
                  website annotation page
                </Link>{" "}
                shows.
              </p>
            </SectionBody>
          </div>

          <div className="lg:order-first">
            <TypedNeverCapturedAnimation />
          </div>
        </div>
      </div>
    </section>
  );
}
