import { source } from "@/lib/docs/source";
import { llms } from "fumadocs-core/source";

export const revalidate = false;

export function GET() {
  const result = llms(source);

  return new Response(result.index(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
