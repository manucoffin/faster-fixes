import { createApp, defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import { createFakeWidget } from "@fasterfixes/widget/testing";
import type { FakeWidget } from "@fasterfixes/widget/testing";
import { createFasterFixes } from "./create-faster-fixes.js";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

const initMock = vi.mocked(init);
let widgets: FakeWidget[];

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
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

const Child = defineComponent(() => () => h("p", "child"));

describe("createFasterFixes", () => {
  it("initialises the Widget with the option object unchanged", () => {
    const options = {
      projectId: "proj_1",
      apiOrigin: "https://api.example.com",
      color: "#ff0000",
      position: "top-left",
      labels: { submitButton: "Send" },
      captureDiagnostics: false,
      customMetadata: () => ({ userId: "user_42" }),
    } as const;

    const wrapper = mount(Child, {
      global: { plugins: [createFasterFixes(options)] },
    });

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith(options);
    expect(initMock.mock.calls[0]?.[0]).toBe(options);
    expect(wrapper.text()).toBe("child");
  });

  it("destroys the instance and leaves no listener when the app unmounts", () => {
    const wrapper = mount(Child, {
      global: { plugins: [createFasterFixes({ projectId: "proj_1" })] },
    });
    wrapper.unmount();

    expect(widgets).toHaveLength(1);
    expect(widgets[0]?.calls.destroy).toHaveLength(1);
    expect(widgets[0]?.listenerCount).toBe(0);
  });

  it("ignores a second install on the same app and warns once", () => {
    const app = createApp(Child);
    app.use(createFasterFixes({ projectId: "proj_1" }));
    app.use(createFasterFixes({ projectId: "proj_1" }));

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("already installed"),
    );
  });

  it("ignores a second install silently in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    const app = createApp(Child);
    app.use(createFasterFixes({ projectId: "proj_1" }));
    app.use(createFasterFixes({ projectId: "proj_1" }));

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("initialises one Widget per app", () => {
    createApp(Child).use(createFasterFixes({ projectId: "proj_1" }));
    createApp(Child).use(createFasterFixes({ projectId: "proj_1" }));

    expect(initMock).toHaveBeenCalledTimes(2);
  });
});
