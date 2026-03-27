import { DashboardSection } from "@/app/(authenticated)/_features/dashboard/dashboard-section";
import { DashboardPageContent } from "@/app/_features/core/dashboard/dashboard-page-content";
import { AgentTokensSection } from "./_features/agent-tokens/agent-tokens-section.client";
import { GitHubIntegrationSection } from "./_features/github/github-integration-section.client";

export default function IntegrationsPage() {
  return (
    <DashboardPageContent breadcrumbs={[{ label: "Integrations" }]}>
      <div className="flex flex-col gap-12">
        <DashboardSection
          title="GitHub"
          description="Connect your GitHub account to automatically create issues from feedback."
          cardTitle="GitHub integration"
          cardClassName="lg:max-w-lg"
        >
          <GitHubIntegrationSection />
        </DashboardSection>

        <DashboardSection
          title="MCP Server"
          description={
            <>
              API tokens for authenticating the Faster Fixes MCP server.{" "}
              <a
                href="/docs/mcp/setup"
                className="text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Setup guide
              </a>
            </>
          }
          cardTitle="MCP Server"
          cardClassName="lg:max-w-lg"
        >
          <AgentTokensSection />
        </DashboardSection>
      </div>
    </DashboardPageContent>
  );
}
