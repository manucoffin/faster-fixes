import { LayoutParams } from "@/types/next";
import { Section } from "@workspace/ui/components/section";

export default function LegalLayout({ children }: LayoutParams) {
  return (
    <Section className="" containerClasseName="max-w-3xl">
      {children}
    </Section>
  );
}
