import { SerializedLinkNode } from "@payloadcms/richtext-lexical";

// Type for populated document objects
type PopulatedDoc = {
  id: string | number;
  slug: string;
  category?: {
    slug: string;
  };
  url?: string; // For media files
  [key: string]: any;
};

export const internalDocToHref = ({
  linkNode,
}: {
  linkNode: SerializedLinkNode;
}) => {
  // Handle internal links with doc field
  const { doc } = linkNode.fields;

  if (!doc) {
    console.warn("Internal link has no doc field:", linkNode);
    return "#";
  }

  const { value, relationTo } = doc;

  // Handle both string ID and object with slug
  let populatedDoc: PopulatedDoc | null = null;
  let fallbackSlug: string | undefined;

  if (typeof value === "string") {
    // If value is just an ID, we'd need to fetch the document
    // For now, return a fallback using the ID
    fallbackSlug = value;
  } else if (value && typeof value === "object") {
    // Extract data from the populated document object
    populatedDoc = value as PopulatedDoc;
  }

  // Handle media collection separately since it doesn't have slugs
  if (relationTo === "media") {
    if (populatedDoc?.url) {
      // Add download parameter to force download
      const separator = populatedDoc.url.includes("?") ? "&" : "?";
      return `${populatedDoc.url}${separator}download=true`;
    } else if (populatedDoc?.id) {
      // Fallback to API route for download by ID
      return `/api/media/download/${populatedDoc.id}`;
    } else {
      console.warn("Media link has no URL or ID:", populatedDoc);
      return "#";
    }
  }

  const slug = populatedDoc?.slug || fallbackSlug;

  if (!slug) {
    console.warn("Could not extract slug from internal link:", {
      value,
      relationTo,
    });
    return "#";
  }

  // Route based on collection type
  switch (relationTo) {
    case "posts":
      return `/blog/${slug}`;
    case "categories":
      return `/blog/${slug}`;
    case "tags":
      return `/blog/tag/${slug}`;
    case "authors":
      return `/blog/auteur/${slug}`;
    default:
      // For any other collection, assume it's a page
      return `/${slug}`;
  }
};
