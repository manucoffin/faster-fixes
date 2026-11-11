// PROTOTYPE (wayfinder ticket 377): the variants outside the inbox, with no
// sign-in. The real host is the Feedback detail panel at /inbox?variant=A.
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PrototypeRecordingMedia } from "../(authenticated)/(project)/inbox/_features/feedback-panel/_prototype-recording/variants.client";

export default function PrototypeRecordingPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="mx-auto flex max-w-[33rem] flex-col gap-5 p-5 pb-24">
      <p className="text-lg leading-snug font-semibold">
        Mark as paid does nothing, I clicked twice and the invoice is still
        unpaid.
      </p>
      <Suspense>
        <PrototypeRecordingMedia fallback={<p>No recording.</p>} />
      </Suspense>
    </div>
  );
}
