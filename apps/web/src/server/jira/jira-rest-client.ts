// Authenticated Jira Cloud REST calls. OAuth 3LO tokens are not bound to a site,
// so every resource call is routed through the api.atlassian.com gateway with the
// installation's cloudId in the path (ADR 0008). Kept separate from jira-client.ts,
// which only handles the auth.atlassian.com token dance.

import { JiraIssueConfigurationError } from "./errors";
import type { AdfDocument } from "./format-issue-adf";

const JIRA_API_GATEWAY = "https://api.atlassian.com/ex/jira";

// Fields Faster Fixes populates when mirroring a Feedback. A required field
// outside this set cannot be filled from Feedback data, so the link is blocked
// rather than allowed to fail at issue-creation time.
const FULFILLABLE_FIELD_IDS = new Set([
  "project",
  "issuetype",
  "summary",
  "description",
]);

// Fields Faster Fixes itself fills in the create payload. A 400 that names only
// these is a bug in what we send, not drift in the customer's Jira configuration,
// so it must surface as a failed run instead of silently flagging the link.
const PAYLOAD_OWNED_FIELD_IDS = new Set(["summary", "description", "labels"]);

// Jira caps project/search at 50 per page; loop rather than truncate so sites
// with many projects still show all of them in the picker.
const PROJECT_PAGE_SIZE = 50;

// Only the two events inbound sync acts on. Subscribing to issue creation would
// re-deliver every issue this app just created, for no gain.
const WEBHOOK_EVENTS = ["jira:issue_updated", "jira:issue_deleted"];

export type JiraProjectSummary = {
  id: string;
  key: string;
  name: string;
};

export type JiraTransition = {
  id: string;
  toStatusName: string;
  // "new" | "indeterminate" | "done".
  toStatusCategory: string;
  // Whether the transition screen exposes a resolution field at all. A workflow
  // that doesn't ask for one rejects the payload if we send it anyway.
  acceptsResolution: boolean;
  // Resolution names the screen offers, when Jira reports them.
  resolutionOptions: string[];
};

export type JiraIssueTypeSummary = {
  id: string;
  name: string;
  description: string | null;
};

type ProjectSearchResponse = {
  values: { id: string; key: string; name: string }[];
  isLast: boolean;
};

type CreateMetaIssueTypesResponse = {
  issueTypes: {
    id: string;
    name: string;
    description?: string;
    // Sub-tasks require a parent issue, which Feedback mirroring has no notion of.
    subtask?: boolean;
  }[];
};

type CreateIssueResponse = {
  id: string;
  key: string;
};

type IssueStatusResponse = {
  key: string;
  // Jira's coarse categories: "new" | "indeterminate" | "done".
  fields: { status: { name: string; statusCategory: { key: string } } };
};

type RegisterWebhookResponse = {
  webhookRegistrationResult?: {
    createdWebhookId?: number;
    errors?: string[];
  }[];
};

type RefreshWebhookResponse = {
  expirationDate: string;
};

type TransitionsResponse = {
  transitions: {
    id: string;
    to: { name: string; statusCategory: { key: string } };
    // Present only with expand=transitions.fields; keyed by field id.
    fields?: Record<string, { allowedValues?: { name?: string }[] }>;
  }[];
};

type CreateMetaFieldsResponse = {
  fields: {
    fieldId: string;
    name: string;
    required: boolean;
    hasDefaultValue?: boolean;
  }[];
};

export class JiraRequestError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
    path: string,
  ) {
    super(`Jira request failed (${status}) for ${path}: ${body}`);
    this.name = "JiraRequestError";
  }
}

/**
 * A 401 means the grant itself is gone, not that this particular call was
 * malformed — retrying cannot recover it, only re-authorization can. 403 is
 * deliberately excluded: it means the authorizing user lacks a permission, which
 * is a Jira-side configuration problem rather than a dead installation.
 */
export function isJiraUnauthorizedError(error: unknown): boolean {
  return error instanceof JiraRequestError && error.status === 401;
}

async function jiraRequest<T>(
  accessToken: string,
  cloudId: string,
  path: string,
  init?: { method: "POST" | "PUT" | "DELETE"; body: unknown },
): Promise<T> {
  const res = await fetch(`${JIRA_API_GATEWAY}/${cloudId}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init ? { "Content-Type": "application/json" } : {}),
    },
    ...(init ? { body: JSON.stringify(init.body) } : {}),
  });

  if (!res.ok) {
    throw new JiraRequestError(res.status, await res.text(), path);
  }

  // Transitions answer 204 with an empty body; res.json() would throw on it.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function listJiraProjects(
  accessToken: string,
  cloudId: string,
): Promise<JiraProjectSummary[]> {
  const projects: JiraProjectSummary[] = [];
  let startAt = 0;

  for (;;) {
    const page = await jiraRequest<ProjectSearchResponse>(
      accessToken,
      cloudId,
      `/rest/api/3/project/search?startAt=${startAt}&maxResults=${PROJECT_PAGE_SIZE}&orderBy=name`,
    );

    projects.push(
      ...page.values.map((p) => ({ id: p.id, key: p.key, name: p.name })),
    );

    if (page.isLast || page.values.length === 0) break;
    startAt += page.values.length;
  }

  return projects;
}

export async function listJiraIssueTypes(
  accessToken: string,
  cloudId: string,
  jiraProjectIdOrKey: string,
): Promise<JiraIssueTypeSummary[]> {
  const data = await jiraRequest<CreateMetaIssueTypesResponse>(
    accessToken,
    cloudId,
    `/rest/api/3/issue/createmeta/${encodeURIComponent(jiraProjectIdOrKey)}/issuetypes`,
  );

  return data.issueTypes
    .filter((type) => !type.subtask)
    .map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description ?? null,
    }));
}

/**
 * Returns the names of required fields that Faster Fixes cannot populate for the
 * given Jira project + issue type. A required field with a default value is
 * fulfillable — Jira fills it itself — so it is not reported.
 */
export async function findUnfulfillableRequiredFields(
  accessToken: string,
  cloudId: string,
  jiraProjectIdOrKey: string,
  issueTypeId: string,
): Promise<string[]> {
  const data = await jiraRequest<CreateMetaFieldsResponse>(
    accessToken,
    cloudId,
    `/rest/api/3/issue/createmeta/${encodeURIComponent(jiraProjectIdOrKey)}/issuetypes/${encodeURIComponent(issueTypeId)}`,
  );

  return data.fields
    .filter(
      (field) =>
        field.required &&
        !field.hasDefaultValue &&
        !FULFILLABLE_FIELD_IDS.has(field.fieldId),
    )
    .map((field) => field.name);
}

/**
 * Transitions available from the issue's *current* status. Jira has no way to set
 * a status directly, and the reachable set depends on where the issue sits in an
 * arbitrary per-project workflow, so this is queried fresh on every sync rather
 * than cached against the link.
 */
export async function listJiraTransitions(
  accessToken: string,
  cloudId: string,
  issueId: string,
): Promise<JiraTransition[]> {
  const data = await jiraRequest<TransitionsResponse>(
    accessToken,
    cloudId,
    `/rest/api/3/issue/${encodeURIComponent(issueId)}/transitions?expand=transitions.fields`,
  );

  return data.transitions.map((transition) => {
    const resolution = transition.fields?.resolution;
    return {
      id: transition.id,
      toStatusName: transition.to.name,
      toStatusCategory: transition.to.statusCategory.key,
      acceptsResolution: !!resolution,
      resolutionOptions: (resolution?.allowedValues ?? []).flatMap((value) =>
        value.name ? [value.name] : [],
      ),
    };
  });
}

export async function transitionJiraIssue(
  accessToken: string,
  cloudId: string,
  issueId: string,
  input: { transitionId: string; resolutionName?: string },
): Promise<void> {
  await jiraRequest<void>(
    accessToken,
    cloudId,
    `/rest/api/3/issue/${encodeURIComponent(issueId)}/transitions`,
    {
      method: "POST",
      body: {
        transition: { id: input.transitionId },
        ...(input.resolutionName
          ? { fields: { resolution: { name: input.resolutionName } } }
          : {}),
      },
    },
  );
}

// Jira reports create failures as `{"errors": {"<fieldId>": "<message>"}}`.
/**
 * Reads an issue's current status straight from Jira. Returns null when the issue
 * is gone (404) — the inbound sync path treats that as a deletion.
 *
 * This is the "re-fetch before apply" primitive: Jira webhook payloads are
 * unsigned, so the payload is only ever used to learn *which* issue to look at,
 * never what its status is (ADR 0008 / PRD #7).
 */
export async function fetchJiraIssueStatus(
  accessToken: string,
  cloudId: string,
  issueId: string,
): Promise<{ key: string; statusName: string; statusCategory: string } | null> {
  try {
    const issue = await jiraRequest<IssueStatusResponse>(
      accessToken,
      cloudId,
      `/rest/api/3/issue/${encodeURIComponent(issueId)}?fields=status`,
    );

    return {
      key: issue.key,
      statusName: issue.fields.status.name,
      statusCategory: issue.fields.status.statusCategory.key,
    };
  } catch (error) {
    if (error instanceof JiraRequestError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Registers a dynamic webhook scoped to a single Jira project. Jira only accepts
 * a URL under the domain declared on the OAuth app, and expires registrations
 * after 30 days — the caller persists the returned id and expiry so the refresh
 * cron can renew them before inbound sync goes quiet.
 */
export async function registerJiraWebhook(
  accessToken: string,
  cloudId: string,
  input: { url: string; jqlFilter: string },
): Promise<{ webhookId: string }> {
  const response = await jiraRequest<RegisterWebhookResponse>(
    accessToken,
    cloudId,
    "/rest/api/3/webhook",
    {
      method: "POST",
      body: {
        url: input.url,
        webhooks: [{ jqlFilter: input.jqlFilter, events: WEBHOOK_EVENTS }],
      },
    },
  );

  const result = response.webhookRegistrationResult?.[0];

  // Jira reports per-webhook failures inside a 200 response rather than a 4xx,
  // so an unchecked result would silently leave the link without inbound sync.
  if (!result?.createdWebhookId) {
    throw new Error(
      `Jira refused the webhook registration: ${result?.errors?.join(", ") ?? "no webhook id returned"}`,
    );
  }

  return { webhookId: String(result.createdWebhookId) };
}

/**
 * Pushes a registration's expiry back to 30 days from now. Refreshed one id at a
 * time even though Jira accepts a batch: the endpoint answers 400 for the whole
 * request when any id is unknown to the app, so a single stale registration would
 * take every other link on the site down with it.
 *
 * Jira returns the new expiry rather than letting callers derive it, so the stored
 * value tracks what Atlassian actually decided.
 */
export async function refreshJiraWebhook(
  accessToken: string,
  cloudId: string,
  webhookId: string,
): Promise<{ expiresAt: Date }> {
  const response = await jiraRequest<RefreshWebhookResponse>(
    accessToken,
    cloudId,
    "/rest/api/3/webhook/refresh",
    { method: "PUT", body: { webhookIds: [Number(webhookId)] } },
  );

  const expiresAt = new Date(response.expirationDate);

  if (Number.isNaN(expiresAt.getTime())) {
    throw new Error(
      `Jira returned an unparseable webhook expiry: ${response.expirationDate}`,
    );
  }

  return { expiresAt };
}

export async function deleteJiraWebhook(
  accessToken: string,
  cloudId: string,
  webhookId: string,
): Promise<void> {
  await jiraRequest<void>(accessToken, cloudId, "/rest/api/3/webhook", {
    method: "DELETE",
    body: { webhookIds: [Number(webhookId)] },
  });
}

function blamesOwnPayload(body: string): boolean {
  try {
    const parsed = JSON.parse(body) as { errors?: Record<string, string> };
    const fieldIds = Object.keys(parsed.errors ?? {});
    return (
      fieldIds.length > 0 &&
      fieldIds.every((fieldId) => PAYLOAD_OWNED_FIELD_IDS.has(fieldId))
    );
  } catch {
    // An unparseable body tells us nothing; fall back to treating it as drift.
    return false;
  }
}

/**
 * Creates an issue and returns it with its resolved status category. The create
 * response carries only id/key/self, so the status is read back in a second call
 * — the category is what the status-sync slice maps on, and guessing "new" would
 * be wrong for workflows whose initial status sits in another category.
 */
export async function createJiraIssue(
  accessToken: string,
  cloudId: string,
  input: {
    jiraProjectId: string;
    issueTypeId: string;
    summary: string;
    description: AdfDocument;
    labels: string[];
  },
): Promise<{ id: string; key: string; statusCategory: string }> {
  let created: CreateIssueResponse;
  try {
    created = await jiraRequest<CreateIssueResponse>(
      accessToken,
      cloudId,
      "/rest/api/3/issue",
      {
        method: "POST",
        body: {
          fields: {
            project: { id: input.jiraProjectId },
            issuetype: { id: input.issueTypeId },
            summary: input.summary,
            description: input.description,
            ...(input.labels.length > 0 ? { labels: input.labels } : {}),
          },
        },
      },
    );
  } catch (error) {
    // 404 = the Jira project is gone or no longer visible to this grant. 400 =
    // the payload was rejected, which is configuration drift (a required field
    // appeared, the issue type no longer accepts it) *unless* Jira blames only
    // the fields we author — that is our bug, and must not be laundered into
    // link ill-health where it would sit unnoticed.
    if (error instanceof JiraRequestError) {
      if (error.status === 404) {
        throw new JiraIssueConfigurationError("stale_project", error.body);
      }
      if (error.status === 400 && !blamesOwnPayload(error.body)) {
        throw new JiraIssueConfigurationError("stale_issue_type", error.body);
      }
    }
    throw error;
  }

  const detail = await jiraRequest<IssueStatusResponse>(
    accessToken,
    cloudId,
    `/rest/api/3/issue/${encodeURIComponent(created.id)}?fields=status`,
  );

  return {
    id: created.id,
    key: created.key,
    statusCategory: detail.fields.status.statusCategory.key,
  };
}
