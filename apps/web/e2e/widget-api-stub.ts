import type {
  CreateFeedbackData,
  FeedbackItem,
  WidgetConfig,
} from "@fasterfixes/core";
import type { Page, Request, Route } from "@playwright/test";

export const WIDGET_API_ORIGIN = "http://widget-api.e2e.test";
export const WIDGET_PROJECT_ID = "proj_e2e";

const ENABLED_CONFIG: WidgetConfig = { enabled: true, branding: false };

type StubOptions = {
  config?: WidgetConfig;
  feedback?: FeedbackItem[];
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
 * the real route handlers, and records each request for assertions. The
 * Feedback list is stateful: a created item shows up in later list calls.
 */
export async function stubWidgetApi(
  page: Page,
  { config = ENABLED_CONFIG, feedback = [] }: StubOptions = {},
): Promise<WidgetApiStub> {
  const requests: StubbedRequest[] = [];
  let items = [...feedback];

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

  return {
    requests,
    requestsTo: (method, path) =>
      requests.filter(
        (request) =>
          request.method === method &&
          (typeof path === "string"
            ? request.path === path
            : path.test(request.path)),
      ),
  };
}
