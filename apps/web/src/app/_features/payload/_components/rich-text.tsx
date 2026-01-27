/**
 * RichText Component for Payload CMS
 *
 * This component renders rich text content from Payload CMS using Lexical editor.
 * It properly handles:
 * - Text formatting (bold, italic, etc.)
 * - Headings with auto-generated IDs
 * - Images and media
 * - Internal links to posts, categories, tags, authors
 * - External links
 *
 * @example
 * ```tsx
 * <RichText
 *   data={post.content}
 *   className="my-custom-class"
 *   enableDebug={process.env.NODE_ENV === 'development'}
 * />
 * ```
 */

import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { RichText as RichTextConverter } from "@payloadcms/richtext-lexical/react";
import { cn } from "@workspace/ui/lib/utils";
import { jsxConverter, jsxConverterClient } from "../converters/converters";

type Props = {
  data: SerializedEditorState;
  enableDebug?: boolean;
  /**
   * Converter mode to use:
   * - "server" (default): Uses server components for blocks like professionalsCarousel (SSR, SEO-friendly)
   * - "client": Uses client components for all blocks (works in client component contexts)
   */
  mode?: "server" | "client";
} & React.HTMLAttributes<HTMLDivElement>;

export function RichText(props: Props) {
  const {
    className,
    enableDebug = false,
    data,
    mode = "server",
    ...rest
  } = props;

  // Debug logging in development
  if (enableDebug && process.env.NODE_ENV === "development") {
    console.log("RichText data:", data);
  }

  // Handle empty or invalid data
  if (!data || !data.root) {
    console.warn("RichText: Invalid or empty data provided");
    return <div className={className}>No content available</div>;
  }

  // Select the appropriate converter based on mode
  const converters = mode === "client" ? jsxConverterClient : jsxConverter;

  return (
    <RichTextConverter
      data={data}
      {...rest}
      className={cn(
        // Default prose styling for rich text content
        "prose prose-gray dark:prose-invert max-w-none",
        // Link styling
        "prose-a:text-primary prose-a:underline prose-a:decoration-primary/30 hover:prose-a:decoration-primary/60 prose-a:transition-colors",
        // Additional custom classes
        className,
      )}
      converters={converters}
    />
  );
}
