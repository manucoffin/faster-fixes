import { DEFAULT_LABELS } from "@fasterfixes/core";
import type { Labels } from "@fasterfixes/core";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const HOST = "[data-ff-widget]";

type TextLabels = Omit<Labels, "pinAriaLabel" | "recordingIncluded">;

// None contains a default label, so any default found on screen is a leak.
export const LABEL_OVERRIDES: TextLabels = {
  submitButton: "Envoyer",
  cancelButton: "Annuler",
  textareaPlaceholder: "Décrivez le problème",
  successMessage: "Retour envoyé",
  closeButton: "Fermer",
  retryButton: "Réessayer",
  errorMessage: "Une erreur est survenue",
  deleteConfirm: "Supprimer ce retour ?",
  deleteButton: "Supprimer",
  editButton: "Modifier",
  saveButton: "Enregistrer",
  showResolved: "Afficher les résolus",
  hideResolved: "Masquer les résolus",
  feedbackListTitle: "Retours",
  emptyList: "Aucun retour sur cette page",
  startFeedback: "Commencer un retour",
  exitFeedbackMode: "Quitter le mode retour",
  showFeedbackList: "Afficher la liste",
  hideFeedbackList: "Masquer la liste",
  showMarkers: "Afficher les repères",
  hideMarkers: "Masquer les repères",
  brandingLink: "Propulsé par FasterFixes",
};
export const PIN_LABEL_PREFIX = "Retour : ";
export const RECORDING_LABEL_PREFIX = "Inclut les dernières secondes : ";

const { pinAriaLabel, recordingIncluded, ...defaultTextLabels } =
  DEFAULT_LABELS;
const DEFAULT_STRINGS = [
  ...Object.values(defaultTextLabels),
  pinAriaLabel("").trim(),
  // The words every default Recording line starts with, whatever its duration.
  recordingIncluded(2).split("2")[0]?.trim() ?? "",
];

// Everything a Reviewer can read or hear: the text of every node, hidden panes
// included, the attributes that name or describe a control, and the
// accessibility tree as a screen reader gets it.
async function widgetStrings(page: Page) {
  const rendered = await page.evaluate((selector) => {
    const root = document.querySelector(selector)?.shadowRoot;
    if (!root) return [];
    const strings = [root.textContent ?? ""];
    for (const element of root.querySelectorAll("*")) {
      for (const name of ["aria-label", "placeholder", "title", "alt"]) {
        const value = element.getAttribute(name);
        if (value) strings.push(value);
      }
    }
    return strings;
  }, HOST);
  const accessible = await page.locator(HOST).ariaSnapshot();
  return [...rendered, accessible].join("\n");
}

async function expectNoDefaultLabel(page: Page) {
  const strings = await widgetStrings(page);
  for (const label of DEFAULT_STRINGS) {
    expect(strings, `default label "${label}" is rendered`).not.toContain(
      label,
    );
  }
}

/**
 * Walks every Widget surface of a page whose Widget was initialised with
 * `LABEL_OVERRIDES` and `PIN_LABEL_PREFIX`, and fails on any default label.
 */
export async function expectLabelsEverywhere(page: Page) {
  const start = page.getByRole("button", {
    name: LABEL_OVERRIDES.startFeedback,
  });
  await expect(start).toBeVisible();
  await expectNoDefaultLabel(page);

  await start.click();
  await expect(
    page.getByRole("button", { name: LABEL_OVERRIDES.exitFeedbackMode }),
  ).toBeVisible();
  await expectNoDefaultLabel(page);

  await page.locator("h1").click();
  const textarea = page.getByPlaceholder(LABEL_OVERRIDES.textareaPlaceholder);
  await expect(textarea).toBeFocused();
  await expectNoDefaultLabel(page);

  await textarea.fill("Titre mal aligné");
  await page
    .getByRole("button", { name: LABEL_OVERRIDES.submitButton })
    .click();
  const pin = page.getByRole("button", {
    name: `${PIN_LABEL_PREFIX}Titre mal aligné`,
  });
  await expect(pin).toBeVisible();
  await expectNoDefaultLabel(page);

  // A submit ends feedback mode once the popover has faded out.
  await start.click();
  await page.getByRole("button", { name: LABEL_OVERRIDES.hideMarkers }).click();
  await expect(
    page.getByRole("button", { name: LABEL_OVERRIDES.showMarkers }),
  ).toBeVisible();
  await expectNoDefaultLabel(page);
  await page.getByRole("button", { name: LABEL_OVERRIDES.showMarkers }).click();

  await page
    .getByRole("button", { name: LABEL_OVERRIDES.showFeedbackList })
    .click();
  await expect(
    page.getByRole("region", { name: LABEL_OVERRIDES.feedbackListTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: LABEL_OVERRIDES.brandingLink }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: LABEL_OVERRIDES.showResolved })
    .click();
  await expect(
    page.getByRole("button", { name: LABEL_OVERRIDES.hideResolved }),
  ).toBeVisible();
  await expectNoDefaultLabel(page);
  await page
    .getByRole("button", { name: LABEL_OVERRIDES.hideFeedbackList })
    .click();

  await pin.click();
  await expect(
    page.getByRole("button", { name: LABEL_OVERRIDES.editButton }),
  ).toBeVisible();
  await expectNoDefaultLabel(page);

  await page
    .getByRole("button", { name: LABEL_OVERRIDES.deleteButton })
    .click();
  await expect(page.getByText(LABEL_OVERRIDES.deleteConfirm)).toBeVisible();
  await expectNoDefaultLabel(page);
}
