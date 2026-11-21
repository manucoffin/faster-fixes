const SITE_URL = "https://www.faster-fixes.com";
const PROJECT_ID_PLACEHOLDER = "proj_your_project_id";
const SCRIPT_EMBED_URL =
  "https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js";

export type QuickStartProject = {
  value: string;
  label: string;
  setup: string;
};

export type QuickStartFramework = {
  value: string;
  label: string;
  /** Absent for the script tag, which installs nothing. */
  packageName?: string;
  requirement?: string;
  guidePath: string;
  /** Used when the framework has no project to pick. */
  setup?: string;
  projects?: QuickStartProject[];
};

function indent(code: string) {
  return code
    .split("\n")
    .map((line) => `   ${line}`)
    .join("\n");
}

const reactImport = `import { FeedbackProvider } from "@fasterfixes/react";`;

const reactFramework: QuickStartFramework = {
  value: "react",
  label: "React",
  packageName: "@fasterfixes/react",
  requirement: "React 18 or newer",
  guidePath: "/docs/widget/install/react",
  projects: [
    {
      value: "nextjs",
      label: "Next.js",
      setup: `Wrap the app with FeedbackProvider inside <body> of the root layout, app/layout.tsx (src/app/layout.tsx with a src folder). With the Pages Router, wrap <Component {...pageProps} /> in pages/_app.tsx instead. The package is already a client module, so the layout stays a Server Component:
${indent(`${reactImport}

<FeedbackProvider projectId="${PROJECT_ID_PLACEHOLDER}">
  {children}
</FeedbackProvider>`)}`,
    },
    {
      value: "vite",
      label: "Vite",
      setup: `Wrap <App /> with FeedbackProvider in the entry file, src/main.tsx:
${indent(`${reactImport}

<FeedbackProvider projectId="${PROJECT_ID_PLACEHOLDER}">
  <App />
</FeedbackProvider>`)}`,
    },
    {
      value: "react-router",
      label: "React Router",
      setup: `Wrap <Outlet /> with FeedbackProvider in the root route, app/root.tsx. With Remix 2, Outlet comes from @remix-run/react:
${indent(`${reactImport}

<FeedbackProvider projectId="${PROJECT_ID_PLACEHOLDER}">
  <Outlet />
</FeedbackProvider>`)}`,
    },
    {
      value: "tanstack-start",
      label: "TanStack Start",
      setup: `Wrap {children} with FeedbackProvider inside <body> of the root route, src/routes/__root.tsx, before <Scripts />:
${indent(`${reactImport}

<FeedbackProvider projectId="${PROJECT_ID_PLACEHOLDER}">
  {children}
</FeedbackProvider>`)}`,
    },
  ],
};

export const quickStartFrameworks: QuickStartFramework[] = [
  reactFramework,
  {
    value: "vue",
    label: "Vue",
    packageName: "@fasterfixes/vue",
    requirement: "Vue 3.5 or newer",
    guidePath: "/docs/widget/install/vue",
    projects: [
      {
        value: "vite",
        label: "Vite",
        setup: `Register the plugin on the app in the entry file, src/main.ts:
${indent(`import { createFasterFixes } from "@fasterfixes/vue";

app.use(createFasterFixes({ projectId: "${PROJECT_ID_PLACEHOLDER}" }));`)}`,
      },
      {
        value: "nuxt",
        label: "Nuxt",
        setup: `Create a Nuxt plugin, plugins/faster-fixes.ts:
${indent(`import { createFasterFixes } from "@fasterfixes/vue";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createFasterFixes({ projectId: "${PROJECT_ID_PLACEHOLDER}" }));
});`)}`,
      },
    ],
  },
  {
    value: "angular",
    label: "Angular",
    packageName: "@fasterfixes/angular",
    requirement: "Angular 19 or newer",
    guidePath: "/docs/widget/install/angular",
    setup: `Add provideFasterFixes to the providers of the application config, src/app/app.config.ts (the same file in Analog). Call it once, never in a lazy route's providers:
${indent(`import { provideFasterFixes } from "@fasterfixes/angular";

provideFasterFixes({ projectId: "${PROJECT_ID_PLACEHOLDER}" }),`)}`,
  },
  {
    value: "svelte",
    label: "Svelte",
    packageName: "@fasterfixes/svelte",
    requirement: "Svelte 5.7 or newer",
    guidePath: "/docs/widget/install/svelte",
    projects: [
      {
        value: "sveltekit",
        label: "SvelteKit",
        setup: `Call initFasterFixes at the top level of the script in the root layout, src/routes/+layout.svelte, not in onMount or an event handler:
${indent(`import { initFasterFixes } from "@fasterfixes/svelte";

initFasterFixes({ projectId: "${PROJECT_ID_PLACEHOLDER}" });`)}`,
      },
      {
        value: "vite",
        label: "Vite",
        setup: `Call initFasterFixes at the top level of the script in the root component, src/App.svelte, not in onMount or an event handler:
${indent(`import { initFasterFixes } from "@fasterfixes/svelte";

initFasterFixes({ projectId: "${PROJECT_ID_PLACEHOLDER}" });`)}`,
      },
    ],
  },
  {
    value: "javascript",
    label: "JavaScript",
    packageName: "@fasterfixes/widget",
    guidePath: "/docs/widget/install/other-frameworks",
    setup: `Call init once in the entry file the bundler loads on every page, such as src/main.ts. In a component framework without its own package (Solid, Preact, Lit), call it when the root component mounts and call widget.destroy() when it unmounts:
${indent(`import { init } from "@fasterfixes/widget";

const widget = init({ projectId: "${PROJECT_ID_PLACEHOLDER}" });`)}`,
  },
  {
    value: "script",
    label: "Script tag",
    guidePath: "/docs/widget/install/script-embed",
    setup: `Add this tag to the template shared by every page, such as the main HTML file, the theme header or the base layout. In an Astro layout, add the is:inline attribute:
${indent(`<script
  src="${SCRIPT_EMBED_URL}"
  data-project-id="${PROJECT_ID_PLACEHOLDER}"
  defer
></script>`)}`,
  },
];

export function findQuickStartFramework(value: string) {
  return (
    quickStartFrameworks.find((framework) => framework.value === value) ??
    reactFramework
  );
}

type BuildQuickStartPromptInput = {
  framework: QuickStartFramework;
  /** Ignored when the framework has no project to pick. */
  projectValue?: string;
};

export function buildQuickStartPrompt({
  framework,
  projectValue,
}: BuildQuickStartPromptInput) {
  const projects = framework.projects ?? [];
  const project =
    projects.find(({ value }) => value === projectValue) ?? projects[0];
  const setup = project?.setup ?? framework.setup ?? "";

  const subject =
    framework.value === "script"
      ? "this site"
      : `this ${framework.label} project${project ? ` with ${project.label}` : ""}`;

  const intro = [
    `Set up the Faster Fixes feedback widget in ${subject}.${
      framework.requirement ? ` It needs ${framework.requirement}.` : ""
    }`,
    `Before you start, ask me for my Faster Fixes Project ID. It starts with proj_ and is in Project settings at ${SITE_URL}/settings. Use it wherever the steps say ${PROJECT_ID_PLACEHOLDER}.`,
  ];

  const steps = [
    ...(framework.packageName
      ? [
          `Install ${framework.packageName} with the project's package manager. If a release-age policy blocks the install, stop and ask me instead of changing it.`,
        ]
      : []),
    setup,
    framework.packageName
      ? "Run the project's build and make sure it passes."
      : "If the project has a build, run it and make sure it passes.",
  ];

  return [
    intro.join("\n"),
    steps.map((step, index) => `${index + 1}. ${step}`).join("\n"),
    `If a step does not fit this project, read the install guide: ${SITE_URL}${framework.guidePath}`,
    "When you're done, tell me how to see the widget: it only shows to Reviewers who open the site through their review link, which I create on the Reviewers page of my Faster Fixes project.",
  ].join("\n\n");
}
