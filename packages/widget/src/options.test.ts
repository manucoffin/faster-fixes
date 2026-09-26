import {
  DEFAULT_API_ORIGIN,
  DEFAULT_LABELS,
  DEFAULT_WIDGET_COLOR,
  DEFAULT_WIDGET_POSITION,
} from "@fasterfixes/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { validateOptions } from "./options.js";

describe("validateOptions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("fills every omitted option with the default from core", () => {
    expect(validateOptions({ projectId: "proj_abc" })).toEqual({
      valid: true,
      options: {
        projectId: "proj_abc",
        apiOrigin: DEFAULT_API_ORIGIN,
        color: DEFAULT_WIDGET_COLOR,
        position: DEFAULT_WIDGET_POSITION,
        labels: DEFAULT_LABELS,
        captureDiagnostics: true,
      },
    });
  });

  it("keeps the options it is given", () => {
    const result = validateOptions({
      projectId: "proj_abc",
      apiOrigin: "http://localhost:3000",
      color: "#ff0000",
      position: "top-left",
      labels: { submitButton: "Send" },
      captureDiagnostics: false,
    });

    expect(result.valid && result.options).toMatchObject({
      apiOrigin: "http://localhost:3000",
      color: "#ff0000",
      position: "top-left",
      labels: { submitButton: "Send" },
      captureDiagnostics: false,
    });
  });

  it.each([
    ["projectId", { projectId: 42 }],
    ["projectId", { projectId: "  " }],
    ["projectId", {}],
    ["position", { projectId: "proj_abc", position: "center" }],
    ["labels", { projectId: "proj_abc", labels: "Send" }],
    ["labels", { projectId: "proj_abc", labels: null }],
    ["labels", { projectId: "proj_abc", labels: ["Send"] }],
  ])("rejects an invalid %s", (option, input) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(validateOptions(input)).toMatchObject({ valid: false, option });
  });

  it("rejects input that is not an object", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(validateOptions(undefined)).toMatchObject({
      valid: false,
      option: "projectId",
    });
  });

  it("names the failing option in a console error in development", () => {
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    validateOptions({ projectId: "proj_abc", position: "center" });

    expect(error).toHaveBeenCalledOnce();
    expect(error.mock.calls[0]?.[0]).toContain("`position`");
  });

  it("stays silent in production but still rejects", () => {
    vi.stubEnv("NODE_ENV", "production");
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(validateOptions({ projectId: 42 })).toMatchObject({ valid: false });
    expect(error).not.toHaveBeenCalled();
  });
});
