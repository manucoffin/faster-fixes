"use client";

import { Button } from "@workspace/ui/components/button";
import { CopyButton } from "@workspace/ui/components/copy-button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { ArrowRight } from "lucide-react";

import {
  REACT_INSTALL_COMMAND,
  buildReactLayoutSnippet,
  buildScriptEmbedSnippet,
} from "../../_helpers/install-snippets";

type InstallSnippetStepProps = {
  projectId: string;
  onNext: () => void;
};

export function InstallSnippetStep({
  projectId,
  onNext,
}: InstallSnippetStepProps) {
  const reactSnippet = buildReactLayoutSnippet(projectId);
  const scriptSnippet = buildScriptEmbedSnippet(projectId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Install the widget</h1>
        <p className="text-sm text-muted-foreground">
          Add the feedback widget to your website. Your Project ID is already
          included in the snippets below.
        </p>
      </div>

      <Tabs defaultValue="react">
        <TabsList>
          <TabsTrigger value="react">React</TabsTrigger>
          <TabsTrigger value="script">Script embed</TabsTrigger>
        </TabsList>

        <TabsContent value="react" className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">1. Install the package</p>
            <div className="relative rounded-md border bg-muted p-3">
              <code className="font-mono text-sm">{REACT_INSTALL_COMMAND}</code>
              <CopyButton
                content={REACT_INSTALL_COMMAND}
                variant="ghost"
                size="icon-xs"
                className="absolute top-2 right-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">
              2. Wrap your app with the provider
            </p>
            <div className="relative rounded-md border bg-muted p-3">
              <pre className="overflow-x-auto font-mono text-sm leading-relaxed">
                <code>{reactSnippet}</code>
              </pre>
              <CopyButton
                content={reactSnippet}
                variant="ghost"
                size="icon-xs"
                className="absolute top-2 right-2"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="script" className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">
            Add this tag to every page, in the head or before the closing body
            tag
          </p>
          <div className="relative rounded-md border bg-muted p-3 pr-10">
            <pre className="overflow-x-auto font-mono text-sm leading-relaxed">
              <code>{scriptSnippet}</code>
            </pre>
            <CopyButton
              content={scriptSnippet}
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Works on any site with no build step, including WordPress, Webflow
            and static HTML.
          </p>
        </TabsContent>
      </Tabs>

      <Button onClick={onNext} className="self-end">
        Done
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
