import {
  type VsAlternative,
  VsAlternativesTable,
} from "./vs-alternatives-table";

export type { VsAlternative };

type VsAlternativesSectionProps = {
  title: string;
  intro: string;
  alternatives: VsAlternative[];
  closingNote?: string;
};

// Centered-header shell kept for the /vs/ pages not yet rebuilt on VsSection.
export function VsAlternativesSection({
  title,
  intro,
  alternatives,
  closingNote,
}: VsAlternativesSectionProps) {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Alternatives
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">{title}</h2>
          <p className="mt-4 text-lg text-muted-foreground">{intro}</p>
        </div>

        <div className="mx-auto mt-12 max-w-5xl">
          <VsAlternativesTable
            alternatives={alternatives}
            closingNote={closingNote}
          />
        </div>
      </div>
    </section>
  );
}
