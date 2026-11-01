import { GITHUB_REPO_URL } from "@/app/_constants/app";

export function LicenseSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            License &amp; contributions
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            AGPL for the app, MIT for the widget
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border p-6">
            <p className="font-mono text-sm font-semibold">AGPL-3.0</p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              The dashboard, the widget API and the agent API. If you deploy a
              modified version as a service, you publish the source. Good for
              ensuring the project stays open.
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="font-mono text-sm font-semibold">MIT</p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              <code>@fasterfixes/widget</code>, <code>@fasterfixes/core</code>,{" "}
              <code>@fasterfixes/react</code>, <code>@fasterfixes/vue</code>,{" "}
              <code>@fasterfixes/angular</code>,{" "}
              <code>@fasterfixes/svelte</code> and the{" "}
              <code>@fasterfixes/mcp</code> server. The packages your clients
              embed and your coding agent runs. Drop them into any project
              without AGPL obligations.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center leading-relaxed text-muted-foreground">
          Contributions are welcome. Open an issue or pull request on{" "}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:no-underline"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </section>
  );
}
