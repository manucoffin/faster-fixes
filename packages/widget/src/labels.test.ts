import { DEFAULT_LABELS } from "@fasterfixes/core";
import type { Labels } from "@fasterfixes/core";
import { describe, expect, it } from "vitest";

import { resolveLabels } from "./labels.js";

describe("resolveLabels", () => {
  it("returns the complete default set without overrides", () => {
    expect(resolveLabels()).toEqual(DEFAULT_LABELS);
  });

  it("merges a partial override over the defaults", () => {
    const labels = resolveLabels({ submitButton: "Envoyer" });

    expect(labels.submitButton).toBe("Envoyer");
    expect(labels.cancelButton).toBe(DEFAULT_LABELS.cancelButton);
  });

  it("resolves every text key to a string", () => {
    const { pinAriaLabel, ...textLabels } = resolveLabels({
      emptyList: "Aucun retour",
    });

    for (const value of Object.values(textLabels)) {
      expect(typeof value).toBe("string");
    }
    expect(pinAriaLabel("Broken link")).toBe("Feedback: Broken link");
  });

  it("uses an overridden pin aria-label pattern", () => {
    const labels = resolveLabels({
      pinAriaLabel: (excerpt) => `Retour : ${excerpt}`,
    });

    expect(labels.pinAriaLabel("Lien cassé")).toBe("Retour : Lien cassé");
  });

  it("keeps the default when an override is missing or of the wrong kind", () => {
    const labels = resolveLabels({
      submitButton: undefined,
      cancelButton: 42,
      pinAriaLabel: "Feedback",
    } as unknown as Partial<Labels>);

    expect(labels.submitButton).toBe(DEFAULT_LABELS.submitButton);
    expect(labels.cancelButton).toBe(DEFAULT_LABELS.cancelButton);
    expect(labels.pinAriaLabel).toBe(DEFAULT_LABELS.pinAriaLabel);
  });

  it("ignores keys outside the labels contract", () => {
    const labels = resolveLabels({ unknown: "x" } as Partial<Labels>);

    expect(labels).toEqual(DEFAULT_LABELS);
  });
});
