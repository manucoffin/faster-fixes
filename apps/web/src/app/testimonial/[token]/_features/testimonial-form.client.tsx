"use client";

import { StarRating } from "@/app/_components/star-rating.client";
import type { SubmitTestimonialInput } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { ActionButton } from "@workspace/ui/components/action-button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import type { UseFormReturn } from "react-hook-form";
import { TestimonialPhotoField } from "./testimonial-photo-field.client";
import type { TestimonialPrefill } from "./use-submit-testimonial";

type TestimonialFormProps = {
  token: string;
  form: UseFormReturn<SubmitTestimonialInput>;
  onSubmit: (event?: React.BaseSyntheticEvent) => Promise<void>;
  isPending: boolean;
  prefill: TestimonialPrefill;
};

export function TestimonialForm({
  token,
  form,
  onSubmit,
  isPending,
  prefill,
}: TestimonialFormProps) {
  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="flex flex-col gap-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <StarRating
                  value={field.value}
                  onChange={field.onChange}
                  name={field.name}
                  aria-label="Rating"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                What would you tell someone who is hesitating to try Faster
                Fixes?
              </FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title (optional)</FormLabel>
                <FormControl>
                  <Input
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
            control={form.control}
            name="organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <FormControl>
                  <Input autoComplete="organization" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website (optional)</FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    autoComplete="url"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
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
          control={form.control}
          name="consent"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormControl>
                <FormLabel className="leading-snug font-normal">
                  Publish my name, photo and this testimonial on the Faster
                  Fixes website.
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <ActionButton pending={isPending} className="self-start">
          {isPending ? "Submitting..." : "Submit testimonial"}
        </ActionButton>
      </form>
    </Form>
  );
}
