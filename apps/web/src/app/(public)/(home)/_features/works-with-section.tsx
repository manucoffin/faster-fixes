import { ClaudeCodeIcon } from "@workspace/ui/components/icons/claude-code-icon";
import { CodexIcon } from "@workspace/ui/components/icons/codex-icon";
import { CursorIcon } from "@workspace/ui/components/icons/cursor-icon";
import { GeminiIcon } from "@workspace/ui/components/icons/gemini-icon";
import { McpIcon } from "@workspace/ui/components/icons/mcp-icon";
import type { ComponentType } from "react";

type Tool = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

const tools: Tool[] = [
  { label: "Claude Code", Icon: ClaudeCodeIcon },
  { label: "Cursor", Icon: CursorIcon },
  { label: "Codex", Icon: CodexIcon },
  { label: "Gemini CLI", Icon: GeminiIcon },
  { label: "MCP server", Icon: McpIcon },
];

export function WorksWithSection() {
  return (
    <section className="w-full pb-12 md:pb-16">
      <div className="container mx-auto flex flex-col items-center px-4">
        <p className="text-muted-foreground">Works with your favorite tools</p>

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
        </ul>
      </div>
    </section>
  );
}
