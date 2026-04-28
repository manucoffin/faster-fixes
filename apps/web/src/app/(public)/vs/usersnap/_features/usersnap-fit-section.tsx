import { CheckIcon } from "lucide-react";

const fitPoints = [
  "You're a dev agency billing clients per project, not per seat.",
  "You want feedback piped directly into Claude Code, Cursor, or Codex via MCP.",
  "You need to self-host for data sovereignty or compliance.",
  "Your clients are non-technical and need a zero-account annotation widget.",
  "You're already on Next.js or React and want a native widget integration.",
];

export function UsersnapFitSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Who it's for
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            FasterFixes is the right fit if
          </h2>
        </div>

        <ul className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4">
          {fitPoints.map((point) => (
            <li
              key={point}
              className="bg-muted/30 flex items-start gap-3 rounded-xl border p-5"
            >
              <CheckIcon className="text-success mt-1 size-5 shrink-0" />
              <span className="text-foreground leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
