import { CameraIcon, CircleSlashIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { BlockElementAnimation } from "../_components/illustrations/block-element-animation";
import { MaskTextAnimation } from "../_components/illustrations/mask-text-animation";
import { TypedNeverCapturedAnimation } from "../_components/illustrations/typed-never-captured-animation";
import { SectionBody } from "../_components/section-body";
import { SectionHeading } from "../_components/section-heading";
import { MaskingMatrix } from "./masking-matrix";

const attributes = [
  {
    name: "data-ff-mask",
    title: (
      <>
        Mask text with <code>data-ff-mask</code>
      </>
    ),
    body: (
      <>
        Replaces the text of the element with <code>*</code> and keeps the
        layout. Set it on <code>&lt;body&gt;</code> to mask the whole page.
      </>
    ),
    Illustration: MaskTextAnimation,
  },
  {
    name: "data-ff-block",
    title: (
      <>
        Block an element with <code>data-ff-block</code>
      </>
    ),
    body: "Replaces the element with an empty placeholder of the same size.",
    Illustration: BlockElementAnimation,
  },
];

export function WebsiteAnnotationMasking() {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto px-4">
        <SectionHeading>Keep sensitive data out of the report</SectionHeading>

        <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionBody>
            <p>
              The Recording is a reconstruction of the page, not a video of the
              screen: about the last minute before the reviewer clicked, with
              structure, text, styles, clicks, scrolling and pointer movement,
              and no audio. Only reviewers are recorded, never the other
              visitors of your site.
            </p>
            <p>
              Some values never enter it at all: the value of every{" "}
              <code>input</code>, <code>textarea</code> and <code>select</code>,
              whatever its type, and the text of every{" "}
              <code>contenteditable</code> element.{" "}
              <span className="text-foreground">
                The Recording shows that the reviewer typed, and where, never
                what.
              </span>{" "}
              There is no attribute and no query that unmasks those fields.
            </p>
          </SectionBody>

          <TypedNeverCapturedAnimation />
        </div>

        <div className="mt-20 md:mt-24">
          <SectionBody className="max-w-3xl">
            <p>
              Everything else you want out of the Recording takes one of two
              attributes, set on your own markup, applying to the element and
              all its descendants.
            </p>
          </SectionBody>

          <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {attributes.map(({ name, title, body, Illustration }) => (
              <li
                key={name}
                className="flex flex-col gap-6 rounded-2xl border bg-background p-6 md:p-8"
              >
                <Illustration />
                <div>
                  <h3 className="text-lg font-medium [&_code]:font-mono">
                    {title}
                  </h3>
                  <SectionBody className="mt-2 text-base">
                    <p>{body}</p>
                  </SectionBody>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <MaskingMatrix />
        </div>

        <div className="mt-16 grid grid-cols-1 gap-12 md:mt-20 lg:grid-cols-2 lg:gap-16">
          <div className="flex gap-4">
            <CameraIcon
              aria-hidden
              className="mt-1.5 size-5 shrink-0 text-muted-foreground"
            />
            <SectionBody>
              <p>
                <span className="text-foreground">
                  Masking does not apply to the Screenshot.
                </span>{" "}
                To keep sensitive data out of screenshots you have exactly one
                instrument, <code>data-ff-block</code>, and it drops the element
                from the image rather than blurring it: the statement image, the
                patient banner, the card block.
              </p>
            </SectionBody>
          </div>

          <div className="flex gap-4">
            <CircleSlashIcon
              aria-hidden
              className="mt-1.5 size-5 shrink-0 text-muted-foreground"
            />
            <SectionBody>
              <p>
                <span className="text-foreground">
                  If a page must never be recorded,
                </span>{" "}
                set <code>captureRecording</code> to <code>false</code>, or add{" "}
                <code>data-capture-recording=&quot;false&quot;</code> to the
                script tag and the recorder is never loaded. The{" "}
                <Link href={"/docs/widget/recording" as Route}>
                  recording documentation
                </Link>{" "}
                carries the full list of what is captured, and a sentence you
                can adapt for your own privacy policy.
              </p>
            </SectionBody>
          </div>
        </div>
      </div>
    </section>
  );
}
