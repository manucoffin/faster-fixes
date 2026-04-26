import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FasterFixesClient } from "./api-client";
import { loadConfig } from "./config";
import { registerCreateFeedbacks } from "./tools/create-feedbacks";
import { registerListFeedbacks } from "./tools/list-feedbacks";
import { registerUpdateFeedbackStatus } from "./tools/update-feedback-status";

const { token, project, baseUrl } = loadConfig();

const client = new FasterFixesClient(baseUrl, token, project);
const server = new McpServer({
  name: "faster-fixes",
  version: "0.0.1",
});

registerListFeedbacks(server, client);
registerCreateFeedbacks(server, client);
registerUpdateFeedbackStatus(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
