import type {
  CreateFeedbackData,
  CreateFeedbackResponse,
  FeedbackListResponse,
  UpdateFeedbackData,
  UpdateFeedbackResponse,
  WidgetConfig,
} from "./types.js";
import { DEFAULT_API_ORIGIN } from "./constants.js";

export type ClientOptions = {
  apiKey: string;
  apiOrigin?: string;
};

export class FasterFixesClient {
  private apiKey: string;
  private apiOrigin: string;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.apiOrigin = (options.apiOrigin ?? DEFAULT_API_ORIGIN).replace(
      /\/$/,
      "",
    );
  }

  private headers(reviewerToken?: string): HeadersInit {
    const h: Record<string, string> = {
      "X-API-Key": this.apiKey,
    };
    if (reviewerToken) {
      h["X-Reviewer-Token"] = reviewerToken;
    }
    return h;
  }

  private async request<T>(
    path: string,
    init: RequestInit,
  ): Promise<T> {
    const res = await fetch(`${this.apiOrigin}${path}`, init);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Request failed" }));
      throw new ApiError(res.status, body.error ?? "Request failed", body.details);
    }
    // 204 No Content
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async getConfig(): Promise<WidgetConfig> {
    return this.request<WidgetConfig>("/api/v1/widget/config", {
      method: "GET",
      headers: this.headers(),
    });
  }

  async getFeedback(
    reviewerToken: string,
    url?: string,
  ): Promise<FeedbackListResponse> {
    const query = url ? `?${new URLSearchParams({ url }).toString()}` : "";
    return this.request<FeedbackListResponse>(
      `/api/v1/feedback${query}`,
      {
        method: "GET",
        headers: this.headers(reviewerToken),
      },
    );
  }

  async createFeedback(
    data: CreateFeedbackData,
    reviewerToken: string,
    screenshot?: Blob,
  ): Promise<CreateFeedbackResponse> {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    if (screenshot) {
      formData.append("screenshot", screenshot, "screenshot.png");
    }

    return this.request<CreateFeedbackResponse>("/api/v1/feedback", {
      method: "POST",
      headers: this.headers(reviewerToken),
      body: formData,
    });
  }

  async updateFeedback(
    id: string,
    data: UpdateFeedbackData,
    reviewerToken: string,
  ): Promise<UpdateFeedbackResponse> {
    return this.request<UpdateFeedbackResponse>(`/api/v1/feedback/${id}`, {
      method: "PUT",
      headers: {
        ...this.headers(reviewerToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  }

  async deleteFeedback(
    id: string,
    reviewerToken: string,
  ): Promise<void> {
    return this.request<void>(`/api/v1/feedback/${id}`, {
      method: "DELETE",
      headers: this.headers(reviewerToken),
    });
  }

  async attachScreenshot(
    feedbackId: string,
    screenshot: Blob,
    reviewerToken: string,
  ): Promise<void> {
    const formData = new FormData();
    formData.append("screenshot", screenshot, "screenshot.png");

    await this.request<unknown>(`/api/v1/feedback/${feedbackId}/screenshot`, {
      method: "PUT",
      headers: this.headers(reviewerToken),
      body: formData,
    });
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
