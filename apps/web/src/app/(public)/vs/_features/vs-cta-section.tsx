import type { ReactNode } from "react";
import { SectionBody } from "../../features/_components/section-body";
import { SectionHeading } from "../../features/_components/section-heading";

type VsCtaSectionProps = {
  title: ReactNode;
  body: ReactNode;
  actions: ReactNode;
};

export function VsCtaSection({ title, body, actions }: VsCtaSectionProps) {
  return (
    <section className="w-full bg-muted/50 py-20 md:py-28">
      <div className="container mx-auto grid grid-cols-1 items-end gap-8 px-4 lg:grid-cols-2 lg:gap-16">
        <SectionHeading className="md:text-5xl">{title}</SectionHeading>

        <div>
          <SectionBody className="max-w-xl">
            <p>{body}</p>
          </SectionBody>
          <div className="mt-8">{actions}</div>
        </div>
      </div>
    </section>
  );
}
