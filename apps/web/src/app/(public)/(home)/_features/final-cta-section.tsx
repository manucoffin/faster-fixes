import { signupUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

export function FinalCtaSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Every feedback message you decode manually is time you could have
            shipped
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Set up FasterFixes in under 5 minutes. One npm install. Free plan
            included.
          </p>

          <div className="mt-8">
            <Button asChild size="lg">
              <Link href={signupUrl}>
                Get Started Free
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
