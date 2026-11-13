"use client";

import { CopyButton } from "@workspace/ui/components/copy-button";
import { AngularIcon } from "@workspace/ui/components/icons/angular-icon";
import { JavascriptIcon } from "@workspace/ui/components/icons/javascript-icon";
import { ReactIcon } from "@workspace/ui/components/icons/react-icon";
import { SvelteIcon } from "@workspace/ui/components/icons/svelte-icon";
import { VueIcon } from "@workspace/ui/components/icons/vue-icon";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { ArrowRightIcon } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { type ComponentType, useState } from "react";

type InstallStep = {
  label: string;
  code: string;
  isCommand?: boolean;
};

type InstallOption = {
  value: string;
  label: string;
  stacks: string;
  Icon: ComponentType<{ className?: string }>;
  steps: InstallStep[];
  guide: Route;
};

const reactOption: InstallOption = {
  value: "react",
  label: "React",
  stacks: "React, Next.js and Remix",
  Icon: ReactIcon,
  steps: [
    {
      label: "Install",
      code: "npm install @fasterfixes/react",
      isCommand: true,
    },
    {
      label: "Wrap your app",
      code: `<FeedbackProvider projectId="proj_your_project_id">
  <App />
</FeedbackProvider>`,
    },
  ],
  guide: "/docs/widget/install/react" as Route,
};

const installOptions: InstallOption[] = [
  reactOption,
  {
    value: "vue",
    label: "Vue",
    stacks: "Vue and Nuxt",
    Icon: VueIcon,
    steps: [
      {
        label: "Install",
        code: "npm install @fasterfixes/vue",
        isCommand: true,
      },
      {
        label: "Register the plugin",
        code: `app.use(
  createFasterFixes({ projectId: "proj_your_project_id" }),
);`,
      },
    ],
    guide: "/docs/widget/install/vue" as Route,
  },
  {
    value: "angular",
    label: "Angular",
    stacks: "Angular and Analog",
    Icon: AngularIcon,
    steps: [
      {
        label: "Install",
        code: "npm install @fasterfixes/angular",
        isCommand: true,
      },
      {
        label: "Add the provider",
        code: `providers: [
  provideFasterFixes({ projectId: "proj_your_project_id" }),
],`,
      },
    ],
    guide: "/docs/widget/install/angular" as Route,
  },
  {
    value: "svelte",
    label: "Svelte",
    stacks: "Svelte and SvelteKit",
    Icon: SvelteIcon,
    steps: [
      {
        label: "Install",
        code: "npm install @fasterfixes/svelte",
        isCommand: true,
      },
      {
        label: "Call it in your root layout",
        code: `<script>
  initFasterFixes({ projectId: "proj_your_project_id" });
</script>`,
      },
    ],
    guide: "/docs/widget/install/svelte" as Route,
  },
  {
    value: "script",
    label: "Script tag",
    stacks: "WordPress, Webflow, Astro and static HTML",
    Icon: JavascriptIcon,
    steps: [
      {
        label: "Paste into the template shared by every page",
        code: `<script
  src="https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js"
  data-project-id="proj_your_project_id"
  defer
></script>`,
      },
    ],
    guide: "/docs/widget/install/script-embed" as Route,
  },
];

export function InstallPanel() {
  const [selected, setSelected] = useState(reactOption.value);
  const option =
    installOptions.find(({ value }) => value === selected) ?? reactOption;

  return (
    <Tabs
      value={selected}
      onValueChange={setSelected}
      className="gap-0 overflow-hidden rounded-2xl border bg-background"
    >
      <div className="overflow-x-auto border-b p-2">
        <TabsList className="h-auto w-full min-w-max bg-transparent p-0">
          {installOptions.map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="h-9 px-3 text-muted-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground dark:data-[state=active]:bg-muted"
            >
              <Icon className="size-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Sized for the tallest tab, so switching tabs does not shift the section. */}
      {installOptions.map(({ value, steps }) => (
        <TabsContent
          key={value}
          value={value}
          className="flex min-h-64 flex-col gap-5 p-4 md:p-6"
        >
          {steps.map(({ label, code, isCommand }) => (
            <div key={label} className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">{label}</p>
              <div className="relative rounded-lg bg-muted">
                <pre className="overflow-x-auto py-3 pr-12 pl-4 font-mono text-sm leading-relaxed">
                  <code>
                    {isCommand && (
                      <span className="text-muted-foreground select-none">
                        ${" "}
                      </span>
                    )}
                    {code}
                  </code>
                </pre>
                <CopyButton
                  content={code}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Copy: ${label}`}
                  className="absolute top-1.5 right-1.5 text-muted-foreground"
                />
              </div>
            </div>
          ))}
        </TabsContent>
      ))}

      <div className="flex flex-col gap-3 border-t bg-muted/50 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="text-muted-foreground">For {option.stacks}.</p>
        <Link
          href={option.guide}
          className="inline-flex shrink-0 items-center gap-1.5 font-medium underline-offset-4 hover:underline"
        >
          Read the install guide
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
    </Tabs>
  );
}
