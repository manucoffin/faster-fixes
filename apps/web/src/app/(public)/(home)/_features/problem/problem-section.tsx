import { ProblemChatAnimation } from "./problem-chat-animation.client";

export function ProblemSection() {
  return (
    <section className="w-full">
      <div className="container mx-auto px-4 pt-16 md:pt-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Why we built this
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Clients don&apos;t write dev tickets
          </h2>
          <p className="mt-4 text-lg text-muted-foreground md:text-xl">
            Before you can fix anything, you have to understand what they meant,
            find what they&apos;re pointing at, and translate it into something
            actionable. That overhead is not the job.
          </p>
        </div>
      </div>

      <ProblemChatAnimation />
    </section>
  );
}
