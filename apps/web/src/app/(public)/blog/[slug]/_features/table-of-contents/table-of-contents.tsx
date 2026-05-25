import type { TableOfContents as Toc } from "fumadocs-core/toc";

import { AnimatedText } from "@workspace/ui/components/animated-text";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export function TableOfContents({ headings }: { headings: Toc }) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold tracking-wide uppercase">
            Table of contents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {headings.map((entry) => (
              <li
                key={entry.url}
                style={{ paddingLeft: `${(entry.depth - 2) * 12}px` }}
              >
                <a
                  href={entry.url}
                  className="text-muted-foreground dark:hover:text-primary-foreground hover:text-foreground text-sm transition-colors"
                >
                  <AnimatedText>{entry.title}</AnimatedText>
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </nav>
  );
}
