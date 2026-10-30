import type { OpenTestimonialRequestOutput } from "@/app/_domains/testimonial/_services/open-testimonial-request";
import type { SubmitTestimonialInput } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { SubmitTestimonialSchema } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export type TestimonialPrefill = Extract<
  OpenTestimonialRequestOutput,
  { state: "open" }
>["prefill"];

// Each step validates only its own fields before the next one opens.
const TESTIMONIAL_FORM_STEPS = [
  ["rating"],
  ["text"],
  ["name", "title", "organization", "website", "photo", "consent"],
] as const satisfies readonly (readonly (keyof SubmitTestimonialInput)[])[];

type UseSubmitTestimonialOptions = {
  token: string;
  prefill: TestimonialPrefill;
};

export function useSubmitTestimonial({
  token,
  prefill,
}: UseSubmitTestimonialOptions) {
  const trpc = useTRPC();

  const form = useForm<SubmitTestimonialInput>({
    resolver: zodResolver(SubmitTestimonialSchema),
    defaultValues: {
      rating: 0,
      text: "",
      name: prefill.name,
      title: "",
      organization: prefill.organization,
      website: prefill.website,
      photo: prefill.image ? { source: "avatar" } : { source: "none" },
      consent: true,
    },
  });

  const [step, setStep] = useState(0);
  const isLastStep = step === TESTIMONIAL_FORM_STEPS.length - 1;

  const goToNextStep = async () => {
    const valid = await form.trigger([...(TESTIMONIAL_FORM_STEPS[step] ?? [])]);
    if (valid) setStep((current) => current + 1);
  };

  const goToPreviousStep = () => setStep((current) => Math.max(0, current - 1));

  const mutation = useMutation(
    trpc.testimonial.submit.mutationOptions({
      onError: (error) => {
        // A refused token renders the expired page instead.
        if (error.data?.code === "PRECONDITION_FAILED") return;
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = form.handleSubmit((values) =>
    mutation.mutate({ token, ...values }),
  );

  return {
    form,
    onSubmit,
    step,
    stepCount: TESTIMONIAL_FORM_STEPS.length,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    isPending: mutation.isPending,
    submitted: mutation.data,
    expired: mutation.error?.data?.code === "PRECONDITION_FAILED",
  };
}
