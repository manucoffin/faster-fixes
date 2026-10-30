"use client";

import type { SubmitTestimonialInput } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { LinkIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { TestimonialPhotoField } from "./testimonial-photo-field.client";
import type { TestimonialPrefill } from "./use-submit-testimonial";

const FIELD_LABEL_CLASS_NAME = "text-base";
const FIELD_INPUT_CLASS_NAME = "h-12 px-4 text-base md:text-base";

type TestimonialCreditFieldsProps = {
  token: string;
  prefill: TestimonialPrefill;
  isPending: boolean;
};

// The last step of the Testimonial form: how the quote is signed, and the
// consent to publish it.
export function TestimonialCreditFields({
  token,
  prefill,
  isPending,
}: TestimonialCreditFieldsProps) {
  const { control } = useFormContext<SubmitTestimonialInput>();

  return (
    <>
      <div className="grid items-start gap-6 sm:grid-cols-2">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL_CLASS_NAME}>Name</FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT_CLASS_NAME}
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL_CLASS_NAME}>
                Title (optional)
              </FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT_CLASS_NAME}
                  placeholder="Founder"
                  autoComplete="organization-title"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="organization"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL_CLASS_NAME}>
                Organization
              </FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT_CLASS_NAME}
                  autoComplete="organization"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={FIELD_LABEL_CLASS_NAME}>
                Website (optional)
              </FormLabel>
              <FormControl>
                <Input
                  className={FIELD_INPUT_CLASS_NAME}
                  type="url"
                  placeholder="https://example.com"
                  autoComplete="url"
                  {...field}
                />
              </FormControl>
              <FormDescription className="flex items-center gap-1.5">
                <LinkIcon aria-hidden className="size-3.5 shrink-0" />
                Your testimonial will link to this site.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="photo"
        render={({ field }) => (
          <FormItem>
            <TestimonialPhotoField
              token={token}
              value={field.value}
              onChange={field.onChange}
              avatar={prefill.image}
              name={prefill.name}
              disabled={isPending}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="consent"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  className="mt-0.5 size-5"
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              </FormControl>
              <FormLabel className="text-base leading-snug font-normal">
                Publish my name, photo and this testimonial on the Faster Fixes
                website.
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
