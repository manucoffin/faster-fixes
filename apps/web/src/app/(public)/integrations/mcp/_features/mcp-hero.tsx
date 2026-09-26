import { Button } from "@workspace/ui/components/button";
import { ClaudeCodeIcon } from "@workspace/ui/components/icons/claude-code-icon";
import { CodexIcon } from "@workspace/ui/components/icons/codex-icon";
import { CursorIcon } from "@workspace/ui/components/icons/cursor-icon";
import { GeminiIcon } from "@workspace/ui/components/icons/gemini-icon";
import { McpIcon } from "@workspace/ui/components/icons/mcp-icon";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ComponentType } from "react";
import { HeroDotBackground } from "../../../(home)/_features/hero/hero-dot-background.client";

type Tool = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

const tools: Tool[] = [
  { label: "Claude Code", Icon: ClaudeCodeIcon },
  { label: "Cursor", Icon: CursorIcon },
  { label: "Codex", Icon: CodexIcon },
  { label: "Gemini CLI", Icon: GeminiIcon },
];

export function McpHero() {
  return (
    <HeroDotBackground>
      <section className="w-full py-20 md:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <p className="mb-4 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            MCP server
          </p>
          <h1 className="text-4xl leading-tight font-normal md:text-5xl lg:text-6xl">
            Client feedback, wired to your coding agent
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            A client leaves feedback on your staging site. Your agent fetches
            it, with the page URL, the exact DOM element, console logs, network
            requests, a screenshot, and full browser context already attached.
            It fixes the code and marks the item resolved. No copy-pasting, no
            &ldquo;can you reproduce this?&rdquo;
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href={"/docs/mcp/setup" as Route}>
                Read the docs
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a
                href="https://www.npmjs.com/package/@fasterfixes/mcp"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on npm
              </a>
            </Button>
          </div>

          <div className="mt-12 flex flex-col items-center">
            <p className="text-sm text-muted-foreground">
              Works with your favorite tools
            </p>
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {tools.map(({ label, Icon }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2"
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </li>
              ))}
              <li className="flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2">
                <McpIcon className="size-4 shrink-0" />
                <span className="text-sm font-medium">
                  Any agent that speaks the Model Context Protocol
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </HeroDotBackground>
  );
}
