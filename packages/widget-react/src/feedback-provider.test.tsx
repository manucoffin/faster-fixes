/* eslint-disable @typescript-eslint/no-deprecated -- these cases exercise the deprecated `apiKey` and `classNames` props */
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import { createFakeWidget } from "./fake-widget.js";
import type { FakeWidget } from "./fake-widget.js";
import { FeedbackProvider } from "./feedback-provider.js";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

const initMock = vi.mocked(init);
let widgets: FakeWidget[] = [];

beforeEach(() => {
  widgets = [];
  initMock.mockImplementation(() => {
    const widget = createFakeWidget();
    widgets.push(widget);
    return widget;
  });
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("FeedbackProvider", () => {
  it("initialises the Widget with its props mapped one to one", () => {
    const labels = { submitButton: "Send" };
    render(
      <FeedbackProvider
        projectId="proj_1"
        apiOrigin="https://api.example.com"
        color="#ff0000"
        position="top-left"
        labels={labels}
        captureDiagnostics={false}
      >
        <p>child</p>
      </FeedbackProvider>,
    );

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith({
      projectId: "proj_1",
      apiOrigin: "https://api.example.com",
      color: "#ff0000",
      position: "top-left",
      labels,
      captureDiagnostics: false,
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("renders only its children on the server and does not initialise", () => {
    const html = renderToString(
      <FeedbackProvider projectId="proj_1">
        <p>child</p>
      </FeedbackProvider>,
    );

    expect(html).toBe(renderToString(<p>child</p>));
    expect(initMock).not.toHaveBeenCalled();
  });

  it("maps apiKey to projectId and warns once when projectId is absent", () => {
    const { rerender } = render(
      <FeedbackProvider apiKey="ff_legacy">child</FeedbackProvider>,
    );
    rerender(
      <FeedbackProvider apiKey="ff_legacy">child again</FeedbackProvider>,
    );

    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "ff_legacy" }),
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("projectId"),
    );
  });

  it("prefers projectId over apiKey without warning", () => {
    render(
      <FeedbackProvider projectId="proj_1" apiKey="ff_legacy">
        child
      </FeedbackProvider>,
    );

    expect(initMock).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: "proj_1" }),
    );
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("ignores classNames and warns once, naming CSS custom properties", () => {
    render(
      <StrictMode>
        <FeedbackProvider projectId="proj_1" classNames={{ button: "btn" }}>
          child
        </FeedbackProvider>
      </StrictMode>,
    );

    expect(initMock).toHaveBeenCalledWith(
      expect.not.objectContaining({ classNames: expect.anything() }),
    );
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("CSS custom properties"),
    );
  });

  it("logs nothing in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(
      <FeedbackProvider apiKey="ff_legacy" classNames={{ button: "btn" }}>
        child
      </FeedbackProvider>,
    );

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("destroys the instance on unmount", () => {
    const { unmount } = render(
      <FeedbackProvider projectId="proj_1">child</FeedbackProvider>,
    );
    unmount();

    expect(widgets).toHaveLength(1);
    expect(widgets[0]?.destroy).toHaveBeenCalledTimes(1);
  });

  it("leaves exactly one live instance under Strict Mode", () => {
    render(
      <StrictMode>
        <FeedbackProvider projectId="proj_1">child</FeedbackProvider>
      </StrictMode>,
    );

    const live = widgets.filter((widget) => !widget.destroy.mock.calls.length);
    expect(live).toHaveLength(1);
  });

  it.each([
    ["projectId", { projectId: "proj_2" }],
    ["apiOrigin", { apiOrigin: "https://other.example.com" }],
    ["color", { color: "#00ff00" }],
    ["position", { position: "top-right" }],
    ["labels", { labels: { submitButton: "Go" } }],
    ["captureDiagnostics", { captureDiagnostics: false }],
  ] as const)("re-initialises when %s changes", (_, changed) => {
    const base = {
      projectId: "proj_1",
      apiOrigin: "https://api.example.com",
      color: "#ff0000",
      position: "bottom-right",
      labels: { submitButton: "Send" },
      captureDiagnostics: true,
    } as const;
    const { rerender } = render(
      <FeedbackProvider {...base}>child</FeedbackProvider>,
    );
    rerender(
      <FeedbackProvider {...base} {...changed}>
        child
      </FeedbackProvider>,
    );

    expect(initMock).toHaveBeenCalledTimes(2);
    expect(initMock).toHaveBeenLastCalledWith(expect.objectContaining(changed));
    expect(widgets[0]?.destroy).toHaveBeenCalledTimes(1);
    expect(widgets[1]?.destroy).not.toHaveBeenCalled();
  });

  it("keeps the instance when a re-render passes equal props", () => {
    const { rerender } = render(
      <FeedbackProvider projectId="proj_1" labels={{ submitButton: "Send" }}>
        child
      </FeedbackProvider>,
    );
    rerender(
      <FeedbackProvider projectId="proj_1" labels={{ submitButton: "Send" }}>
        new child
      </FeedbackProvider>,
    );

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(widgets[0]?.destroy).not.toHaveBeenCalled();
  });
});
