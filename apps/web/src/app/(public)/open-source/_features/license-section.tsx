import { GITHUB_REPO_URL } from "@/app/_constants/app";

export function LicenseSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-3 text-sm font-semibold tracking-wider uppercase">
            License &amp; contributions
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            AGPL for the app, MIT for the widget
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border p-6">
            <p className="font-mono text-sm font-semibold">AGPL-3.0</p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              The dashboard, API, and MCP server. If you deploy a modified
              version as a service, you publish the source. Good for ensuring
              the project stays open.
            </p>
          </div>
          <div className="rounded-xl border p-6">
            <p className="font-mono text-sm font-semibold">MIT</p>
            <p className="text-muted-foreground mt-3 leading-relaxed">
              <code>@fasterfixes/core</code> and <code>@fasterfixes/react</code>
              . The widget packages your clients embed. Drop them into any
              project without AGPL obligations.
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mt-8 text-center leading-relaxed">
          Contributions are welcome — open an issue or pull request on{" "}
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
