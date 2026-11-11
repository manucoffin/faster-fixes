import type {
  CreateFeedbackData,
  FeedbackItem,
  WidgetConfig,
} from "@fasterfixes/core";
import type { Page, Request, Route } from "@playwright/test";

import { routeRecorderFile } from "./recorder-file";

export const WIDGET_API_ORIGIN = "http://widget-api.e2e.test";
export const WIDGET_PROJECT_ID = "proj_e2e";

const ENABLED_CONFIG: WidgetConfig = { enabled: true, branding: false };

/**
 * How the stub answers a Recording upload: stored, refused with a 409, failed
 * at the network level, or left without an answer.
 */
type RecordingResponse = "stored" | "refused" | "network-error" | "hang";

type StubOptions = {
  config?: WidgetConfig;
  feedback?: FeedbackItem[];
  recording?: RecordingResponse;
};

type StubbedRequest = {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: Buffer | null;
};

type WidgetApiStub = {
  requests: StubbedRequest[];
  requestsTo: (method: string, path: string | RegExp) => StubbedRequest[];
  /** The payload of every create request, in order. */
  createdFeedback: () => (CreateFeedbackData | null)[];
  /** The id the stub gave each created item, in order. */
  createdIds: () => string[];
  /** The URL of every request for the recorder file the script embed inserts. */
  recorderRequests: string[];
};

// The widget calls the API cross-origin with custom headers, so every answer,
// preflight included, carries the CORS headers the real proxy sets.
function corsHeaders(request: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": request.headers()["origin"] ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, X-Reviewer-Token",
  };
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    headers: corsHeaders(route.request()),
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

// The create request is multipart with the payload JSON in a `data` field.
function readCreateData(body: Buffer | null): CreateFeedbackData | null {
  if (!body) return null;
  const match = /name="data"\r\n\r\n([\s\S]*?)\r\n--/.exec(body.toString());
  return match?.[1] ? (JSON.parse(match[1]) as CreateFeedbackData) : null;
}

function toCreatedItem(data: CreateFeedbackData | null): FeedbackItem {
  return {
    id: `e2e-${Date.now().toString(36)}`,
    status: "new",
    comment: data?.comment ?? "",
    pageUrl: data?.pageUrl ?? "",
    clickX: data?.clickX ?? null,
    clickY: data?.clickY ?? null,
    selector: data?.selector ?? null,
    screenshotUrl: null,
    reviewer: { id: "e2e-reviewer", name: "E2E Reviewer" },
    createdAt: new Date().toISOString(),
    metadata: data?.metadata ?? null,
  };
}

/**
 * Answers every widget HTTP API endpoint for `page` with bodies shaped like
 * the real route handlers, and records each request for assertions. Serves
 * the recorder file from the workspace build, in place of the CDN. The
 * Feedback list is stateful: a created item shows up in later list calls.
 */
export async function stubWidgetApi(
  page: Page,
  {
    config = ENABLED_CONFIG,
    feedback = [],
    recording = "stored",
  }: StubOptions = {},
): Promise<WidgetApiStub> {
  const requests: StubbedRequest[] = [];
  let items = [...feedback];
  const createdIds: string[] = [];
  const recorderRequests = await routeRecorderFile(page);

  await page.route(`${WIDGET_API_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const method = request.method();
    const { pathname } = new URL(request.url());

    if (method === "OPTIONS") {
      return route.fulfill({ status: 204, headers: corsHeaders(request) });
    }

    const body = request.postDataBuffer();
    requests.push({ method, path: pathname, headers: request.headers(), body });

    if (pathname === "/api/v1/widget/config" && method === "GET") {
      return json(route, 200, config);
    }
    if (pathname === "/api/v1/feedback" && method === "GET") {
      return json(route, 200, { feedback: items });
    }
    if (pathname === "/api/v1/feedback" && method === "POST") {
      const created = toCreatedItem(readCreateData(body));
      items = [...items, created];
      createdIds.push(created.id);
      return json(route, 201, created);
    }

    const screenshotMatch = /^\/api\/v1\/feedback\/([^/]+)\/screenshot$/.exec(
      pathname,
    );
    if (screenshotMatch && method === "PUT") {
      return json(route, 200, {
        screenshotUrl: `${WIDGET_API_ORIGIN}/screenshots/${screenshotMatch[1]}.png`,
      });
    }

    if (
      /^\/api\/v1\/feedback\/[^/]+\/recording$/.test(pathname) &&
      method === "PUT"
    ) {
      if (recording === "refused") {
        return json(route, 409, { error: "Recording already attached" });
      }
      if (recording === "network-error") return route.abort("failed");
      if (recording === "hang") return;
      return route.fulfill({ status: 204, headers: corsHeaders(request) });
    }

    const itemMatch = /^\/api\/v1\/feedback\/([^/]+)$/.exec(pathname);
    const id = itemMatch?.[1];
    if (id && method === "PUT") {
      const { comment } = request.postDataJSON() as { comment: string };
      items = items.map((item) =>
        item.id === id ? { ...item, comment } : item,
      );
      return json(route, 200, {
        id,
        comment,
        updatedAt: new Date().toISOString(),
      });
    }
    if (id && method === "DELETE") {
      items = items.filter((item) => item.id !== id);
      return route.fulfill({ status: 204, headers: corsHeaders(request) });
    }

    return json(route, 404, { error: "Not found" });
  });

  const requestsTo = (method: string, path: string | RegExp) =>
    requests.filter(
      (request) =>
        request.method === method &&
        (typeof path === "string"
          ? request.path === path
          : path.test(request.path)),
    );

  return {
    requests,
    requestsTo,
    createdFeedback: () =>
      requestsTo("POST", "/api/v1/feedback").map((request) =>
        readCreateData(request.body),
      ),
    createdIds: () => [...createdIds],
    recorderRequests,
  };
}
