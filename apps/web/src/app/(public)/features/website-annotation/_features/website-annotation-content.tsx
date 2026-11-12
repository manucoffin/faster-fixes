import type { Route } from "next";
import Link from "next/link";

const mcpSetupCommand = `claude mcp add faster-fixes -s project \\
  --env FASTER_FIXES_TOKEN=ff_agent_xxx \\
  --env FASTER_FIXES_PROJECT=proj_xxx \\
  -- npx -y @fasterfixes/mcp`;

export function WebsiteAnnotationIntro() {
  return (
    <p className="lead">
      Faster Fixes is a website annotation tool for the teams who ship client
      sites: agencies, freelancers, and developers whose stakeholder does not
      write tickets. The client opens a review link, clicks the element that
      looks wrong, writes one sentence, submits. Their part stops there: the
      report already carries the selector, the screenshot, the page URL, the
      browser, the console and network history and a replay of the last minute.
      What comes next is the part a canvas tool does not give you: an
      open-source stack you can self-host, and a report your coding agent reads
      on its own.
    </p>
  );
}

export function WebsiteAnnotationHowItWorks() {
  return (
    <section>
      <h2>
        Click an element, comment, no account: a feedback tool for websites your
        clients finish in two clicks
      </h2>
      <p>
        A review does not need a canvas, a Chrome extension or a signup from
        your client. You create the project, generate the review link, and the
        widget only renders for reviewers who arrive through it: your public
        visitors never see a floating button, and your client just opens a URL.
        They click the misaligned card, the label, the dead button, type the
        comment, submit.
      </p>
      <p>
        That is why we built a website feedback tool rather than a markup layer.
        There is no PNG to export afterwards, because the page is the report.
        Clients annotate website elements in place, and the capture documents
        the rest: page URL, CSS selector, click position and viewport, browser
        and OS, a screenshot at submission, console output and network requests
        from just before, plus the replay of the previous minute.
      </p>
      <p>
        Every install path mounts the same widget: the{" "}
        <Link href={"/docs/widget/overview" as Route}>widget overview</Link>{" "}
        lists them all, and the{" "}
        <Link href={"/docs/widget/install/script-embed" as Route}>
          script embed
        </Link>{" "}
        covers WordPress, Webflow and static HTML.
      </p>
    </section>
  );
}

export function WebsiteAnnotationMasking() {
  return (
    <section>
      <h2>Keeping sensitive data out of the Recording and the Screenshot</h2>
      <p>
        The Recording is a reconstruction of the page, not a video of the
        screen: about the last minute before the reviewer clicked, with
        structure, text, styles, clicks, scrolling and pointer movement, and no
        audio. Only reviewers are recorded, never the other visitors of your
        site.
      </p>
      <p>
        Some values never enter it at all: the value of every <code>input</code>
        , <code>textarea</code> and <code>select</code>, whatever its type, and
        the text of every <code>contenteditable</code> element. The Recording
        shows that the reviewer typed, and where, never what. There is no
        attribute and no query that unmasks those fields.
      </p>
      <p>
        Everything else you want out of the Recording takes one of two
        attributes, set on your own markup, applying to the element and all its
        descendants. <code>data-ff-mask</code> replaces the text of the element
        with <code>*</code> and keeps the layout. Set it on{" "}
        <code>&lt;body&gt;</code> to mask the whole page.{" "}
        <code>data-ff-block</code> replaces the element with an empty
        placeholder of the same size.
      </p>
      <table>
        <thead>
          <tr>
            <th>What the report can contain</th>
            <th>Recording (last minute)</th>
            <th>Screenshot</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A typed field value</td>
            <td>Never captured, no attribute needed</td>
            <td>Still visible</td>
          </tr>
          <tr>
            <td>
              Text under <code>data-ff-mask</code>
            </td>
            <td>
              Replaced with <code>*</code>
            </td>
            <td>Still visible</td>
          </tr>
          <tr>
            <td>
              An element under <code>data-ff-block</code>
            </td>
            <td>Empty placeholder, same size</td>
            <td>Removed from the image</td>
          </tr>
        </tbody>
      </table>
      <p>
        Masking does not apply to the Screenshot. To keep sensitive data out of
        screenshots you have exactly one instrument, <code>data-ff-block</code>,
        and it drops the element from the image rather than blurring it: the
        statement image, the patient banner, the card block. If a page must
        never be recorded, set <code>captureRecording</code> to{" "}
        <code>false</code>, or add{" "}
        <code>data-capture-recording=&quot;false&quot;</code> to the script tag
        and the recorder is never loaded. The{" "}
        <Link href={"/docs/widget/recording" as Route}>
          recording documentation
        </Link>{" "}
        carries the full list of what is captured, and a sentence you can adapt
        for your own privacy policy.
      </p>
    </section>
  );
}

export function WebsiteAnnotationOpenSource() {
  return (
    <section>
      <h2>
        Open source and self-hostable: the widget, the API and the MCP server on
        your own infrastructure
      </h2>
      <p>
        The app (dashboard, widget API and agent API) is AGPL-3.0, and the
        widget your clients load runs on MIT packages:{" "}
        <code>@fasterfixes/widget</code>, <code>@fasterfixes/core</code>,{" "}
        <code>@fasterfixes/react</code>, <code>@fasterfixes/vue</code>,{" "}
        <code>@fasterfixes/angular</code>, <code>@fasterfixes/svelte</code>,
        plus the MCP server. Embedding those carries no AGPL obligation, so the
        licence covers the service you run, not the sites you deliver.
      </p>
      <p>
        On one machine, <code>docker compose up</code> starts the app,
        PostgreSQL and a self-hosted Inngest server with files on local disk. On
        a managed host it is a Next.js deployment, Postgres 14+, an Inngest app,
        a bucket or local disk, and an email provider. Recording is included,
        needs no extra service, keeps the same 4 MB cap and is stored with your
        screenshots. Billing stays out: Stripe only runs on the hosted version.
        A self-hosted instance resolves to the Agency plan: unlimited projects,
        feedback and members, white-label widget and every integration.
      </p>
      <p>
        Start with the{" "}
        <Link href={"/docs/self-hosting" as Route}>self-hosting guide</Link> and
        the <Link href="/open-source">open-source page</Link>. If you are
        mid-migration, the <Link href={"/vs/bugherd" as Route}>BugHerd</Link>{" "}
        and <Link href={"/vs/marker-io" as Route}>Marker.io</Link> comparisons
        line up licence, plan and per-seat cost.
      </p>
    </section>
  );
}

export function WebsiteAnnotationMcp() {
  return (
    <section>
      <h2>
        From annotation to fix: feedback your coding agent reads through MCP
      </h2>
      <p>
        The report is written to be read twice: once by you, once by an agent.
        Through the <Link href={"/integrations/mcp" as Route}>MCP server</Link>{" "}
        your coding agent calls <code>list_feedbacks</code>, filters by{" "}
        <code>status</code> and <code>page_url</code>, and receives
        agent-readable markdown with the full repro bundle on every item. It
        edits the code, then calls <code>update_feedback_status</code> to move
        the item from new to in progress to resolved, so the board matches the
        branch. <code>create_feedbacks</code> imports up to 100 items per call
        from a CSV or JSON export, atomically and without opening an issue per
        row.
      </p>
      <p>Setup is one command, no global install:</p>
      <pre>
        <code>{mcpSetupCommand}</code>
      </pre>
      <p>
        Claude Code, Cursor, Windsurf, VS Code, Codex and Zed are each covered
        in the <Link href={"/docs/mcp/setup" as Route}>MCP setup docs</Link>.
        Tokens are scoped per capability: read, update and create are separate
        permissions, and nothing delete or admin is exposed. You revoke one from
        the dashboard without a redeploy. The server works on the Free plan, and{" "}
        <code>FASTER_FIXES_URL</code> points it at your own instance.
      </p>
    </section>
  );
}

export function WebsiteAnnotationCta() {
  return (
    <section>
      <h2>Start annotating your site this afternoon</h2>
      <p>
        Nothing to migrate. Install <code>@fasterfixes/react</code> or drop the
        script tag into your layout, send one review link, take the first
        report, and check what your own pages leak: the masking attributes are
        markup, not a paid tier. The Free plan carries one project, twenty
        feedback items and the full capture, so a real page from a real client
        is enough to see the difference between a comment and a report.
        Self-hosting costs nothing under AGPL-3.0. See{" "}
        <Link href="/pricing">pricing</Link> for what Pro adds when your second
        project starts.
      </p>
    </section>
  );
}
