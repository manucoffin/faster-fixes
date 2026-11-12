import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FasterFixesClient } from "../api-client";

export const BASE_URL = "https://api.test";
export const PROJECT_ID = "project-1";

/**
 * An MCP client connected in memory to a server with the given tools, all
 * talking to the API at `BASE_URL`. Stub `fetch` to answer the API.
 */
export async function connectTools(
  ...register: Array<(server: McpServer, client: FasterFixesClient) => void>
) {
  const server = new McpServer({ name: "faster-fixes", version: "0.0.0" });
  const api = new FasterFixesClient(BASE_URL, "test-token", PROJECT_ID);
  for (const r of register) r(server, api);

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0.0.0" });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return client;
}

type Route = (url: URL, init?: RequestInit) => Response | Promise<Response>;

/** A `fetch` stub answering each request by its URL, 404 when unmatched. */
export function fetchStub(routes: Record<string, Route>) {
  return async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input);
    const key = `${url.origin}${url.pathname}`;
    const route = routes[key];
    if (!route) return new Response("Not found", { status: 404 });
    return route(url, init);
  };
}
