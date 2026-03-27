"use client";

import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { ArrowRight } from "lucide-react";

type InstallSnippetStepProps = {
  apiKey: string;
  onNext: () => void;
};

function buildSnippet(apiKey: string) {
  return `import { FeedbackProvider } from "@fasterfixes/react";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <FeedbackProvider apiKey="${apiKey}">
          {children}
        </FeedbackProvider>
      </body>
    </html>
  );
}`;
}

export function InstallSnippetStep({
  apiKey,
  onNext,
}: InstallSnippetStepProps) {
  const snippet = buildSnippet(apiKey);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Install the widget</h1>
        <p className="text-muted-foreground text-sm">
          Add the feedback widget to your React application. Your API key is
          already included in the snippet below.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">1. Install the package</p>
          <div className="bg-muted relative rounded-md border p-3">
            <code className="font-mono text-sm">
              npm install @fasterfixes/react
            </code>
            <CopyButton
              content="npm install @fasterfixes/react"
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">2. Wrap your app with the provider</p>
          <div className="bg-muted relative rounded-md border p-3">
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed">
              <code>{snippet}</code>
            </pre>
            <CopyButton
              content={snippet}
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2"
            />
          </div>
        </div>
      </div>

      <Button onClick={onNext} className="self-end">
        Done
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
