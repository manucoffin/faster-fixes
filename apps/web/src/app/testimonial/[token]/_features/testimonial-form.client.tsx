"use client";

import { StarRating } from "@/app/_components/star-rating.client";
import type { SubmitTestimonialInput } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { ActionButton } from "@workspace/ui/components/action-button";
import { Button } from "@workspace/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Progress } from "@workspace/ui/components/progress";
import { Textarea } from "@workspace/ui/components/textarea";
import type { UseFormReturn } from "react-hook-form";
import { TestimonialCreditFields } from "./testimonial-credit-fields.client";
import type { TestimonialPrefill } from "./use-submit-testimonial";

// The form is alone on the page and often opened on a phone from an email,
// so everything is sized up for reading and tapping.
const STEP_QUESTION_CLASS_NAME = "text-2xl leading-snug font-semibold";
const NAVIGATION_BUTTON_CLASS_NAME = "h-12 min-w-36 px-8 text-base";

type TestimonialFormProps = {
  token: string;
  form: UseFormReturn<SubmitTestimonialInput>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isPending: boolean;
  prefill: TestimonialPrefill;
  step: number;
  stepCount: number;
  isLastStep: boolean;
  goToNextStep: () => Promise<void>;
  goToPreviousStep: () => void;
};

export function TestimonialForm({
  token,
  form,
  onSubmit,
  isPending,
  prefill,
  step,
  stepCount,
  isLastStep,
  goToNextStep,
  goToPreviousStep,
}: TestimonialFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          if (isLastStep) return void onSubmit(event);
          // Enter in an earlier step advances instead of submitting.
          event.preventDefault();
          void goToNextStep();
        }}
        className="flex flex-col gap-10"
        noValidate
      >
        <div className="space-y-2">
          <Progress value={((step + 1) / stepCount) * 100} />
          <p className="text-center text-sm text-muted-foreground">
            Step {step + 1} of {stepCount}
          </p>
        </div>

        {/* Every step stays mounted so values and the uploaded photo preview
            survive going back and forth. */}
        <div hidden={step !== 0}>
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem className="justify-items-center gap-6 text-center">
                <FormLabel className={STEP_QUESTION_CLASS_NAME}>
                  How would you rate Faster Fixes?
                </FormLabel>
                <FormControl>
                  <StarRating
                    value={field.value}
                    onChange={field.onChange}
                    name={field.name}
                    aria-label="Rating"
                    className="gap-2 [&_svg]:size-12"
                  />
                </FormControl>
                <FormMessage className="text-base" />
              </FormItem>
            )}
          />
        </div>

        <div hidden={step !== 1}>
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem className="gap-6">
                <FormLabel
                  className={`${STEP_QUESTION_CLASS_NAME} justify-center text-center`}
                >
                  What would you tell someone who is hesitating to try Faster
                  Fixes?
                </FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    placeholder="For example: the problem it solved for your team, how your clients report issues now, or the time it saves on each round of feedback."
                    className="min-h-48 p-4 text-lg md:text-lg"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-base" />
              </FormItem>
            )}
          />
        </div>

        <div hidden={step !== 2} className="space-y-8">
          <h2 className={`${STEP_QUESTION_CLASS_NAME} text-center`}>
            How should we credit you?
          </h2>
          <TestimonialCreditFields
            token={token}
            prefill={prefill}
            isPending={isPending}
          />
        </div>

        <div className="flex justify-center gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className={NAVIGATION_BUTTON_CLASS_NAME}
              onClick={goToPreviousStep}
              disabled={isPending}
            >
              Back
            </Button>
          )}
          {isLastStep ? (
            <ActionButton
              pending={isPending}
              className={NAVIGATION_BUTTON_CLASS_NAME}
            >
              {isPending ? "Submitting..." : "Submit testimonial"}
            </ActionButton>
          ) : (
            <Button
              type="button"
              className={NAVIGATION_BUTTON_CLASS_NAME}
              onClick={() => void goToNextStep()}
            >
              Continue
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
