import { cn } from "@workspace/ui/lib/utils";

export const proseClasses = cn(
  "font-sans",
  "max-w-none",
  "prose",
  "dark:prose-invert",
  "whitespace-pre-wrap",

  {
    // Headings
    "prose-headings:font-bold": true,
    "prose-headings:mt-6": true,
    "prose-headings:mb-2": true,
  },
  {
    // Paragraphs
    "prose-p:mt-2": true,
    "prose-p:mb-4": true,
  },
  {
    "prose-a:relative": true, // Position the anchor tag relative to its container
    "prose-a:overflow-hidden": true, // Hide overflow to prevent background spilling
    "prose-a:font-normal": true,
    "prose-a:underline": true,
    "prose-a:underline-offset-4": true,
    "prose-a:transition-colors": true,
    "prose-a:duration-300": true,
    "prose-a:decoration-primary": true,
    "hover:prose-a:text-primary": true,
  },
  {
    // Unordered lists
    "prose-ul:mt-4": true,
  },
  {
    // List items
    "prose-li:mb-2": true,
  },
  {
    // Images
    "prose-img:rounded-lg": true,
  },
);
