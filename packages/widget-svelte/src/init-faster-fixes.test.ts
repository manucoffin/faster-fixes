import { flushSync, mount, unmount } from "svelte";
import type { Component } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import { createFakeWidget } from "@fasterfixes/widget/testing";
import type { FakeWidget } from "@fasterfixes/widget/testing";
import Reinstall from "./test-components/Reinstall.svelte";
import Root from "./test-components/Root.svelte";
import ShowOnMount from "./test-components/ShowOnMount.svelte";

vi.mock("@fasterfixes/widget", () => ({ init: vi.fn() }));

const initMock = vi.mocked(init);
let widgets: FakeWidget[];
let component: ReturnType<typeof mount> | undefined;

beforeEach(() => {
  widgets = [];
  initMock.mockImplementation(() => {
    const widget = createFakeWidget();
    widgets.push(widget);
    return widget;
  });
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

afterEach(async () => {
  if (component) await unmount(component);
  component = undefined;
  document.body.innerHTML = "";
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

// Svelte's ambient `*.svelte` declaration leaves component props untyped.
type RootProps = { child?: Component };

function mountRoot(props: RootProps = {}) {
  const mounted = mount(Root, {
    target: document.body,
    props: { options: { projectId: "proj_1" }, ...props },
  });
  flushSync();
  return mounted;
}

describe("initFasterFixes", () => {
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

    component = mount(Root, { target: document.body, props: { options } });
    flushSync();

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith(options);
    expect(initMock.mock.calls[0]?.[0]).toBe(options);
    expect(document.body.textContent).toBe("true-0-true");
  });

  it("destroys the instance and leaves no listener when the root is destroyed", async () => {
    await unmount(mountRoot());

    expect(widgets).toHaveLength(1);
    expect(widgets[0]?.calls.destroy).toHaveLength(1);
    expect(widgets[0]?.listenerCount).toBe(0);
  });

  it("ignores a second call under the same root and warns once", () => {
    component = mountRoot({ child: Reinstall });

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("[faster-fixes]"),
    );
  });

  it("ignores a second call silently in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    component = mountRoot({ child: Reinstall });

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("initialises one Widget per independent root", async () => {
    const first = mountRoot();
    component = mountRoot();

    expect(initMock).toHaveBeenCalledTimes(2);
    await unmount(first);
  });

  it("reaches the instance from a child's onMount", () => {
    component = mountRoot({ child: ShowOnMount });

    expect(widgets[0]?.calls.show).toHaveLength(1);
  });
});
