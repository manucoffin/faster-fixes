import { EnvironmentInjector, createEnvironmentInjector } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { init } from "@fasterfixes/widget";
import { createFakeWidget } from "@fasterfixes/widget/testing";
import type { FakeWidget } from "@fasterfixes/widget/testing";
import { provideFasterFixes } from "./provide-faster-fixes.js";

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

// Creating the injector runs the environment initializers.
function bootstrap(providers: Parameters<typeof provideFasterFixes>[0][]) {
  TestBed.configureTestingModule({
    providers: providers.map(provideFasterFixes),
  });
  TestBed.inject(EnvironmentInjector);
}

describe("provideFasterFixes", () => {
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

    bootstrap([options]);

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith(options);
    expect(initMock.mock.calls[0]?.[0]).toBe(options);
  });

  it("destroys the instance and leaves no listener when the application is destroyed", () => {
    bootstrap([{ projectId: "proj_1" }]);
    TestBed.resetTestingModule();

    expect(widgets).toHaveLength(1);
    expect(widgets[0]?.calls.destroy).toHaveLength(1);
    expect(widgets[0]?.listenerCount).toBe(0);
  });

  it("ignores a second provider and warns once", () => {
    bootstrap([{ projectId: "proj_1" }, { projectId: "proj_1" }]);

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("already provided"),
    );
  });

  it("ignores a second provider in a child environment injector", () => {
    bootstrap([{ projectId: "proj_1" }]);
    // What a lazy route with its own providers creates.
    createEnvironmentInjector(
      [provideFasterFixes({ projectId: "proj_1" })],
      TestBed.inject(EnvironmentInjector),
    );

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("ignores a second provider silently in a production build", () => {
    vi.stubEnv("NODE_ENV", "production");
    bootstrap([{ projectId: "proj_1" }, { projectId: "proj_1" }]);

    expect(initMock).toHaveBeenCalledTimes(1);
    expect(console.warn).not.toHaveBeenCalled();
  });
});
