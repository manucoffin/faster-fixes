import { CheckIcon } from "lucide-react";

const fitPoints = [
  "You're a dev agency or product team building React or Next.js apps and need feedback that maps directly to component trees and DOM selectors.",
  "You want AI coding agents — Claude Code, Cursor, Codex — to read and act on feedback directly from the terminal or IDE, without context-switching to a browser dashboard.",
  "You need to self-host: client feedback must stay in your own infrastructure, not a third-party cloud.",
  "You want flat pricing — one plan covers your whole team at a fixed monthly rate, not a per-seat bill that grows with every new member.",
  "You don't need whitelabel or a client portal — you need structured, code-mapped feedback that goes straight into GitHub issues and your AI agent's context.",
];

export function AtarimFitSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            Right fit
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
