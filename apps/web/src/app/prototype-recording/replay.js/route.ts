// PROTOTYPE (wayfinder ticket 377): serves the vendored rrweb replayer build.
// It is stored as .txt because the repo lints every committed .js file.
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response(null, { status: 404 });
  }
  const source = await readFile(
    path.join(process.cwd(), "public/_prototype-recording/replay.umd.min.txt"),
    "utf8",
  );
  return new Response(source, {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  });
}
