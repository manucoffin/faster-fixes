import type { LayoutParams } from "@/types/next";
import { Section } from "@workspace/ui/components/section";

export default function LegalLayout({ children }: LayoutParams) {
  return (
    <Section containerClasseName="max-w-3xl">
      <article className="wysiwyg max-w-none dark:wysiwyg-invert">
        {children}
      </article>
    </Section>
  );
}
