import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

const withoutItems = [
  'Client says "the button is wrong." No page, no element, no screenshot.',
  "You go back and forth with the client just to understand what they meant and where it is.",
  "You rephrase everything in developer terms before your coding agent can even start.",
];

export function BeforeAfterSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            The difference
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            See what changes
          </h2>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {/* Without */}
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-7">
            <span className="mb-5 block text-sm font-semibold tracking-wider text-red-400 uppercase">
              Without FasterFixes
            </span>
            <ul className="flex flex-col gap-6">
              {withoutItems.map((item) => (
                <li
                  key={item}
                  className="text-muted-foreground text-lg leading-relaxed"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* With */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-7">
            <span className="mb-5 block text-sm font-semibold tracking-wider text-emerald-400 uppercase">
              With FasterFixes
            </span>
            <p className="text-lg leading-relaxed">
              Client annotates the site directly in the browser.
            </p>
            <p className="mt-6 text-lg leading-relaxed">
              Coding agent fetches feedback with full context and fixes it.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href={signupUrl}>
              Try it free
              <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
