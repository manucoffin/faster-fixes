import { SerializedTextNode } from "@payloadcms/richtext-lexical";
import { JSXConverters } from "@payloadcms/richtext-lexical/react";

/**
 * TextStateFeature Converter
 *
 * Handles rendering of text nodes with state-based styling (colors, underlines).
 * Also preserves other text formatting (bold, italic, underline, etc) from the format property.
 * The state values are stored in the node's $ property, which is populated by TextStateFeature.
 *
 * @example
 * Text node with TextStateFeature applied:
 * {
 *   type: "text",
 *   text: "Styled text",
 *   format: 1,  // bold
 *   $: {
 *     color: "primary-text",
 *     underline: "primary-underline"
 *   }
 * }
 */

type SerializedTextNodeWithState = SerializedTextNode & {
  $?: {
    color?: string;
    underline?: string;
  };
};

// Mapping of text state values to inline styles
const colorStateStyles: Record<string, React.CSSProperties> = {
  "text-red": { color: "light-dark(#DC2626, #EF4444)" },
  "text-orange": { color: "light-dark(#EA580C, #F97316)" },
  "text-yellow": { color: "light-dark(#CA8A04, #EAB308)" },
  "text-green": { color: "light-dark(#16A34A, #22C55E)" },
  "text-blue": { color: "light-dark(#2563EB, #3B82F6)" },
  "text-purple": { color: "light-dark(#9333EA, #A855F7)" },
  "text-pink": { color: "light-dark(#DB2777, #EC4899)" },
  "bg-red": {
    backgroundColor: "light-dark(#DC2626, #EF4444)",
    color: "white",
  },
  "bg-orange": {
    backgroundColor: "light-dark(#EA580C, #F97316)",
    color: "white",
  },
  "bg-yellow": {
    backgroundColor: "light-dark(#CA8A04, #EAB308)",
    color: "white",
  },
  "bg-green": {
    backgroundColor: "light-dark(#16A34A, #22C55E)",
    color: "white",
  },
  "bg-blue": {
    backgroundColor: "light-dark(#2563EB, #3B82F6)",
    color: "white",
  },
  "bg-purple": {
    backgroundColor: "light-dark(#9333EA, #A855F7)",
    color: "white",
  },
  "bg-pink": {
    backgroundColor: "light-dark(#DB2777, #EC4899)",
    color: "white",
  },
};

/**
 * Get CSS properties for format flags (Lexical text format bitwise flags)
 */
function getFormatStyles(format: number): React.CSSProperties {
  const styles: React.CSSProperties = {};

  // Bold (flag: 1)
  if (format & 1) {
    styles.fontWeight = "bold";
  }

  // Italic (flag: 2)
  if (format & 2) {
    styles.fontStyle = "italic";
  }

  // Strikethrough (flag: 4)
  if (format & 4) {
    styles.textDecoration = "line-through";
  }

  // Underline from format (flag: 8)
  if (format & 8) {
    styles.textDecoration = styles.textDecoration
      ? `${styles.textDecoration} underline`
      : "underline";
  }

  // Code (flag: 16)
  if (format & 16) {
    styles.fontFamily = "monospace";
    styles.backgroundColor = "rgba(0, 0, 0, 0.05)";
    styles.padding = "0 4px";
    styles.borderRadius = "3px";
  }

  // Subscript (flag: 32)
  if (format & 32) {
    styles.verticalAlign = "sub";
    styles.fontSize = "0.83em";
  }

  // Superscript (flag: 64)
  if (format & 64) {
    styles.verticalAlign = "super";
    styles.fontSize = "0.83em";
  }

  return styles;
}

export const textStateConverter: JSXConverters<SerializedTextNodeWithState> = {
  text: ({ node }) => {
    const color = node.$?.color;
    const format = node.format ?? 0;

    // Build combined style object from format flags, color state, and underline state
    const styles: React.CSSProperties = {
      ...getFormatStyles(format),
      ...getColorStyles(color),
    };

    // If no styles are applied, return plain text
    if (Object.keys(styles).length === 0) {
      return <>{node.text}</>;
    }

    // Return styled span with applied styles
    return <span style={styles}>{node.text}</span>;
  },
};

/**
 * Get CSS properties for color state value
 */
function getColorStyles(colorState?: string): React.CSSProperties {
  if (!colorState || !colorStateStyles[colorState]) {
    return {};
  }
  return colorStateStyles[colorState];
}
