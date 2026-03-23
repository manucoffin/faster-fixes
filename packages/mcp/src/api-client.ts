type ListFeedbacksParams = {
  status?: string;
  page_url?: string;
  format?: "json" | "markdown";
};

type FeedbackJson = {
  id: string;
  status: string;
  comment: string;
  pageUrl: string;
  selector: string | null;
  clickX: number | null;
  clickY: number | null;
  viewportWidth: number | null;
  viewportHeight: number | null;
  browserName: string | null;
  browserVersion: string | null;
  os: string | null;
  screenshotUrl: string | null;
  reviewerName: string;
  createdAt: string;
};

type ListFeedbacksJsonResponse = {
  feedbacks: FeedbackJson[];
  count: number;
};

type UpdateStatusResponse = {
  id: string;
  status: string;
  updatedAt: string;
};

type ApiError = {
  error: string;
  code: string;
};

export class FasterFixesClient {
  constructor(
    private baseUrl: string,
    private token: string,
    private projectId: string,
  ) {}

  private async request<T>(
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as ApiError | null;
      throw new Error(
        body?.error ?? `API error: ${res.status} ${res.statusText}`,
      );
    }

    // Handle markdown responses
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/markdown")) {
      return (await res.text()) as T;
    }

    return res.json() as Promise<T>;
  }

  async listFeedbacks(
    params?: ListFeedbacksParams,
  ): Promise<ListFeedbacksJsonResponse | string> {
    const searchParams = new URLSearchParams();
    searchParams.set("project", this.projectId);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.page_url) searchParams.set("page_url", params.page_url);
    if (params?.format) searchParams.set("format", params.format);

    const format = params?.format ?? "json";
    if (format === "markdown") {
      return this.request<string>(
        `/api/v1/agent/feedbacks?${searchParams.toString()}`,
      );
    }

    return this.request<ListFeedbacksJsonResponse>(
      `/api/v1/agent/feedbacks?${searchParams.toString()}`,
    );
  }

  async updateFeedbackStatus(
    feedbackId: string,
    status: string,
  ): Promise<UpdateStatusResponse> {
    return this.request<UpdateStatusResponse>(
      `/api/v1/agent/feedbacks/${feedbackId}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status }),
      },
    );
  }
}
