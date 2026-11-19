import type { ReactNode } from "react";
import { HeroDotBackground } from "../../(home)/_features/hero/hero-dot-background.client";
import { SectionBody } from "../../features/_components/section-body";
import { VsBreadcrumb } from "./vs-breadcrumb";

type VsHeroProps = {
  breadcrumbLabel: string;
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  actions: ReactNode;
  illustration: ReactNode;
};

export function VsHero({
  breadcrumbLabel,
  eyebrow,
  title,
  description,
  actions,
  illustration,
}: VsHeroProps) {
  return (
    <HeroDotBackground>
      <section className="w-full pt-8 pb-20 md:pb-24">
        <div className="container mx-auto px-4">
          <VsBreadcrumb label={breadcrumbLabel} />

          <div className="mt-12 grid grid-cols-1 items-center gap-12 md:mt-16 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div className="flex flex-col items-start">
              <p className="text-sm text-muted-foreground">{eyebrow}</p>
              <h1 className="mt-4 max-w-2xl text-4xl leading-tight font-normal tracking-tight text-balance md:text-5xl lg:text-6xl">
                {title}
              </h1>
              <SectionBody className="mt-6 max-w-xl">
                <p>{description}</p>
              </SectionBody>
              <div className="mt-10">{actions}</div>
            </div>

            {illustration}
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
