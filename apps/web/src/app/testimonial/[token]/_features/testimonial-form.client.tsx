"use client";

import { StarRating } from "@/app/_components/star-rating.client";
import type { OpenTestimonialRequestOutput } from "@/app/_domains/testimonial/_services/open-testimonial-request";
import type { SubmitTestimonialInput } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { SubmitTestimonialSchema } from "@/app/_domains/testimonial/_services/submit-testimonial.schema";
import { resolveS3Url } from "@/utils/url/resolve-s3-url";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
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
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { useForm } from "react-hook-form";

type TestimonialFormProps = {
  prefill: Extract<OpenTestimonialRequestOutput, { state: "open" }>["prefill"];
};

export function TestimonialForm({ prefill }: TestimonialFormProps) {
  const form = useForm<SubmitTestimonialInput>({
    resolver: zodResolver(SubmitTestimonialSchema),
    defaultValues: {
      rating: 0,
      text: "",
      name: prefill.name,
      title: "",
      organization: prefill.organization,
      website: prefill.website,
      consent: false,
    },
  });

  // Validation only: the submit procedure is wired by the next slice.
  const onSubmit = () => undefined;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
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

        <div className="space-y-2">
          <Label>Photo</Label>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              {prefill.image ? (
                <AvatarImage src={resolveS3Url(prefill.image)} alt="" />
              ) : null}
              <AvatarFallback>
                {prefill.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              {prefill.image
                ? "Your account photo."
                : "Your account has no photo."}
            </p>
          </div>
        </div>

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

        <Button type="submit" className="self-start">
          Submit testimonial
        </Button>
      </form>
    </Form>
  );
}
