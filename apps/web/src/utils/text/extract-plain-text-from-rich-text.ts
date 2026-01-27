import { createHeadlessEditor } from "@lexical/headless";
import type { SerializedEditorState } from "lexical";
import { $getRoot } from "lexical";
import { ListNode, ListItemNode } from "@lexical/list";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";

/**
 * Extract plain text content from Payload CMS rich text (Lexical) JSON
 */
export function extractPlainTextFromRichText(
  richTextData: SerializedEditorState,
) {
  if (!richTextData || typeof richTextData !== "object") {
    return "";
  }

  try {
    // Create a headless editor instance with plugins for common node types
    const headlessEditor = createHeadlessEditor({
      nodes: [
        HeadingNode,
        ListNode,
        ListItemNode,
        QuoteNode,
        LinkNode,
        AutoLinkNode,
        CodeNode,
        CodeHighlightNode,
      ],
    });

    // Parse and set the editor state from the rich text JSON
    const editorState = headlessEditor.parseEditorState(richTextData);

    // Extract plain text content
    const plainText = editorState.read(() => {
      return $getRoot().getTextContent();
    });

    return plainText || "";
  } catch (error) {
    console.error("Error extracting plain text from rich text:", error);
    return "";
  }
}
