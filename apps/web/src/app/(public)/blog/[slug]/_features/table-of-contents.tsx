import { Post } from "@workspace/payload/payload.types";
import Link from "next/link";
import slugify from "slugify";

interface TableOfContentsItem {
  title: string;
  slug: string;
}

interface TableOfContentsProps {
  content: Post["content"];
}

function extractH2Headings(content: Post["content"]) {
  if (!content) return [];

  const headings: TableOfContentsItem[] = [];

  function processNode(node: any) {
    if (!node) return;

    if (node.type === "heading" && node.tag === "h2" && node.children) {
      const title = extractTextFromNodes(node.children);
      if (title) {
        const slug = slugify(title, { lower: true, strict: true });
        headings.push({ title, slug });
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(processNode);
    }
  }

  if (content.root && content.root.children) {
    content.root.children.forEach(processNode);
  }

  return headings;
}

function extractTextFromNodes(nodes: any[]): string {
  if (!nodes || !Array.isArray(nodes)) return "";

  return nodes
    .map((node) => {
      if (node.type === "text") {
        return node.text || "";
      }
      if (node.children && Array.isArray(node.children)) {
        return extractTextFromNodes(node.children);
      }
      return "";
    })
    .join("")
    .trim();
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const headings = extractH2Headings(content);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="bg-muted/50 mb-8 rounded-lg border p-6">
      <h2 className="mb-4 text-lg font-semibold">Table of contents</h2>
      <nav>
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li key={index}>
              <Link
                href={`#${heading.slug}`}
                className="text-muted-foreground hover:text-primary block transition-colors duration-200"
              >
                {heading.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
