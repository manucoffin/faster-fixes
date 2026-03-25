export function ReframeSection() {
  return (
    <section className="bg-muted/50 w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            The problem is not the feedback. It is the format.
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed md:text-xl">
            Annotation tools solve the input problem — they give clients a
            better way to point at things. But the output is still a pin on a
            screenshot with a comment attached. A human still has to read it,
            interpret it, find the code, and write the task.
          </p>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed md:text-xl">
            The bottleneck was never how clients give feedback. It was what
            arrives on the developer&apos;s side.
          </p>
          <p className="mt-8 text-lg font-medium leading-relaxed md:text-xl">
            What if every piece of feedback arrived as structured markdown — with
            all the technical context your coding agent needs to locate the code
            and fix the issue?
          </p>
        </div>
      </div>
    </section>
  );
}
