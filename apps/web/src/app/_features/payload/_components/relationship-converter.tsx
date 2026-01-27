import { SerializedRelationshipNode } from "@payloadcms/richtext-lexical";
import { JSXConverters } from "@payloadcms/richtext-lexical/react";
import { Route } from "next";
import Link from "next/link";

type PopulatedDoc = {
  id: string | number;
  slug: string;
  name?: string;
  title?: string;
  category?: {
    slug: string;
  };
  url?: string;
};

function getDocumentHref(relationTo: string, doc: PopulatedDoc): string {
  switch (relationTo) {
    case "posts":
      return `/blog/${doc.category?.slug}/${doc.slug}`;
    case "categories":
      return `/blog/${doc.slug}`;
    case "tags":
      return `/blog/tag/${doc.slug}`;
    case "authors":
      return `/blog/auteur/${doc.slug}`;
    case "media":
      return doc.url || `#media-${doc.slug}`;
    default:
      return `#${relationTo}-${doc.slug}`;
  }
}

function getDocumentTitle(doc: PopulatedDoc): string {
  return doc.title || doc.name || `${doc.slug}`;
}

export const relationshipConverter: JSXConverters<SerializedRelationshipNode> =
{
  relationship: ({ node }) => {
    const { relationTo, value } = node;

    if (!value || typeof value !== "object") {
      return <span>Missing relationship</span>;
    }

    const doc = value as PopulatedDoc;
    const href = getDocumentHref(relationTo, doc) as Route;
    const title = getDocumentTitle(doc);

    return (
      <Link href={href} className="underline transition-colors">
        {title}
      </Link>
    );
  },
};
