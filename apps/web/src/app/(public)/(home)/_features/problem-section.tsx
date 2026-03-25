import {
  LinkIcon,
  ImageIcon,
  MessageCircleQuestionIcon,
} from "lucide-react";

const failureModes = [
  {
    icon: LinkIcon,
    title: "The missing URL",
    description:
      "Which page? The client didn't say. You check five pages before finding it.",
  },
  {
    icon: ImageIcon,
    title: "The blurry screenshot",
    description:
      "Taken on a phone, zoomed in, no browser chrome. You cannot tell if it is mobile or desktop.",
  },
  {
    icon: MessageCircleQuestionIcon,
    title: "The vague instruction",
    description:
      "\"Can you make this better?\" No element specified, no expected behavior, no acceptance criteria.",
  },
];

export function ProblemSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            You already know this workflow
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed md:text-xl">
            A client sends a WhatsApp voice note and three screenshots taken
            from their phone. One shows the wrong page. Another is cropped so
            you cannot see the URL bar. The third has a red circle drawn
            around... something. The message says &quot;this doesn&apos;t look
            right on my end.&quot;
          </p>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed md:text-xl">
            You spend the next 20 minutes finding the page, opening dev tools,
            guessing the browser, and reconstructing what they saw.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="text-muted-foreground text-lg md:text-xl">
            That 20-minute detour happens several times a week across every
            active project. Over a year, you lose hundreds of hours — not
            building, not shipping, just decoding what your client meant.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {failureModes.map((mode) => (
            <div
              key={mode.title}
              className="bg-muted/50 flex flex-col gap-3 rounded-lg border p-6"
            >
              <mode.icon className="text-muted-foreground size-6" />
              <h3 className="font-semibold">{mode.title}</h3>
              <p className="text-muted-foreground text-sm">
                {mode.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
