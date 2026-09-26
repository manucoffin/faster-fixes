import { renderToString } from "react-dom/server";
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import type { Widget } from "@fasterfixes/widget";
import { createFakeWidget } from "./fake-widget.js";
import type { FakeWidget } from "./fake-widget.js";
import { FeedbackProvider } from "./feedback-provider.js";
import { useFeedback } from "./use-feedback.js";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

const initMock = vi.mocked(init);
let widget: FakeWidget;

const item = { id: "fb_1" } as Widget["feedbackItems"][number];

beforeEach(() => {
  widget = createFakeWidget();
  initMock.mockReturnValue(widget);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <FeedbackProvider projectId="proj_1">{children}</FeedbackProvider>;
}

describe("useFeedback", () => {
  it("returns the unmounted defaults during server rendering", () => {
    function Probe() {
      const { isVisible, feedbackItems, showPins } = useFeedback();
      return <>{JSON.stringify({ isVisible, feedbackItems, showPins })}</>;
    }

    const html = renderToString(
      <FeedbackProvider projectId="proj_1">
        <Probe />
      </FeedbackProvider>,
    );

    expect(html).toBe(
      JSON.stringify({
        isVisible: false,
        feedbackItems: [],
        showPins: true,
      }).replaceAll('"', "&quot;"),
    );
  });

  it("reads the instance state once mounted", () => {
    const { result } = renderHook(() => useFeedback(), { wrapper });

    expect(result.current.isVisible).toBe(true);
    expect(result.current.feedbackItems).toEqual([]);
    expect(result.current.showPins).toBe(true);
  });

  it("re-renders the calling component when the instance notifies", () => {
    let renders = 0;
    function Probe() {
      renders += 1;
      const { isVisible, feedbackItems, showPins } = useFeedback();
      return (
        <p data-testid="probe">
          {`${isVisible}-${feedbackItems.length}-${showPins}`}
        </p>
      );
    }
    const { getByTestId } = render(<Probe />, { wrapper });
    const before = renders;

    act(() => widget.emit({ isVisible: false }));
    expect(getByTestId("probe").textContent).toBe("false-0-true");

    act(() => widget.emit({ feedbackItems: [item] }));
    expect(getByTestId("probe").textContent).toBe("false-1-true");

    act(() => widget.emit({ showPins: false }));
    expect(getByTestId("probe").textContent).toBe("false-1-false");
    expect(renders).toBeGreaterThan(before);
  });

  it("delegates its methods to the instance", () => {
    const { result } = renderHook(() => useFeedback(), { wrapper });

    result.current.show();
    result.current.hide();
    result.current.startAnnotation();
    result.current.togglePins();

    expect(widget.show).toHaveBeenCalledTimes(1);
    expect(widget.hide).toHaveBeenCalledTimes(1);
    expect(widget.startAnnotation).toHaveBeenCalledTimes(1);
    expect(widget.togglePins).toHaveBeenCalledTimes(1);
  });

  it("stops listening to an instance once the provider unmounts", () => {
    const { unmount } = renderHook(() => useFeedback(), { wrapper });
    unmount();

    expect(widget.listenerCount).toBe(0);
  });

  it("throws outside a FeedbackProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => renderHook(() => useFeedback())).toThrow(
      "useFeedback must be used within a FeedbackProvider",
    );
  });
});
