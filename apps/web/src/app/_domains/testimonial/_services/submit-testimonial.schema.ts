import { z } from "zod";

export const SubmitTestimonialSchema = z.object({
  rating: z
    .number({ message: "Select a rating." })
    .int()
    .min(1, "Select a rating.")
    .max(5, "Select a rating."),
  text: z
    .string()
    .trim()
    .min(1, "Enter your testimonial.")
    .max(2000, "Keep your testimonial under 2,000 characters."),
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Keep your name under 100 characters."),
  title: z.string().trim().max(100, "Keep your title under 100 characters."),
  organization: z
    .string()
    .trim()
    .min(1, "Enter your organization.")
    .max(100, "Keep your organization under 100 characters."),
  website: z
    .string()
    .trim()
    .max(200, "Keep your website under 200 characters.")
    .refine(
      (value) =>
        value === "" ||
        z.url({ protocol: /^https?$/ }).safeParse(value).success,
      "Enter a valid URL, starting with https://.",
    ),
  consent: z
    .boolean()
    .refine((value) => value, "Agree to publication to submit."),
});

export type SubmitTestimonialInput = z.infer<typeof SubmitTestimonialSchema>;
