import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

import { seedReviewerToken } from "./reviewer-token";
import { stubWidgetApi } from "./widget-api-stub";

/**
 * When the page's listeners run. `bubble` is how Radix (shadcn) dialogs
 * listen; `capture` is how focus-trap and Headless UI do.
 */
type ListenerPhase = "bubble" | "capture";

/**
 * Opens a modal dialog the way dialog libraries do: every other child of the
 * body is made `inert` and `aria-hidden`, and focus is pulled back to the
 * dialog's button whenever it moves outside the dialog.
 */
export function openFocusTrappingDialog(page: Page, phase: ListenerPhase) {
  return page.evaluate((capture) => {
    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Host dialog");
    Object.assign(dialog.style, {
      position: "fixed",
      top: "80px",
      left: "80px",
      width: "320px",
      padding: "24px",
      background: "white",
      zIndex: "1000",
    });
    const heading = document.createElement("h2");
    heading.textContent = "Dialog heading";
    const action = document.createElement("button");
    action.textContent = "Dialog action";
    dialog.append(heading, action);

    for (const sibling of Array.from(document.body.children)) {
      sibling.setAttribute("inert", "");
      sibling.setAttribute("aria-hidden", "true");
    }
    document.body.appendChild(dialog);
    action.focus();

    const trap = (event: FocusEvent) => {
      const target =
        event.type === "focusin" ? event.target : event.relatedTarget;
      if (target instanceof Node && !dialog.contains(target)) action.focus();
    };
    document.addEventListener("focusin", trap, capture);
    document.addEventListener("focusout", trap, capture);
  }, phase === "capture");
}

/** Opens a non-modal drawer that closes on any press outside it. */
export function openDismissableDrawer(page: Page, phase: ListenerPhase) {
  return page.evaluate((capture) => {
    const drawer = document.createElement("aside");
    drawer.setAttribute("aria-label", "Host drawer");
    drawer.textContent = "Drawer content";
    Object.assign(drawer.style, {
      position: "fixed",
      left: "0",
      bottom: "0",
      width: "160px",
      height: "120px",
      background: "white",
      zIndex: "1000",
    });
    document.body.appendChild(drawer);

    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !drawer.contains(event.target)) {
        drawer.remove();
      }
    };
    for (const type of ["pointerdown", "mousedown"]) {
      document.addEventListener(type, dismiss, capture);
    }
  }, phase === "capture");
}

/**
 * With a focus-trapping modal open over the page, a Reviewer selects an
 * element inside it, types and submits without the dialog taking focus back.
 */
export async function submitInsideFocusTrap(
  page: Page,
  path: string,
  phase: ListenerPhase,
) {
  const api = await stubWidgetApi(page);
  await seedReviewerToken(page);
  await page.goto(path);
  const start = page.getByRole("button", { name: "Start feedback" });
  await expect(start).toBeVisible();

  await openFocusTrappingDialog(page, phase);
  const host = page.locator("[data-ff-widget]").first();
  await expect(host).not.toHaveAttribute("inert");
  await expect(host).not.toHaveAttribute("aria-hidden");

  // Found by role only because the host is back in the accessibility tree.
  await start.click();
  const dialog = page.getByRole("dialog", { name: "Host dialog" });
  await dialog.getByRole("heading", { name: "Dialog heading" }).click();

  const comment = page.getByPlaceholder("Describe the issue...");
  await expect(comment).toBeFocused();
  await page.keyboard.type("The dialog title is cut off");
  await expect(comment).toBeFocused();
  await expect(comment).toHaveValue("The dialog title is cut off");

  await page.getByRole("button", { name: "Submit" }).click();
  await expect.poll(() => api.createdFeedback().length).toBe(1);
  expect(api.createdFeedback()[0]?.comment).toBe("The dialog title is cut off");
  await expect(dialog).toBeVisible();
}

/**
 * With a drawer open that closes on outside presses, starting annotation and
 * selecting an element outside the drawer leave it open.
 */
export async function selectOutsideDismissableDrawer(
  page: Page,
  path: string,
  phase: ListenerPhase,
) {
  await stubWidgetApi(page);
  await seedReviewerToken(page);
  await page.goto(path);
  const start = page.getByRole("button", { name: "Start feedback" });
  await expect(start).toBeVisible();

  await openDismissableDrawer(page, phase);
  const drawer = page.getByRole("complementary", { name: "Host drawer" });
  await expect(drawer).toBeVisible();

  await start.click();
  await page.locator("h1").click();

  await expect(page.getByPlaceholder("Describe the issue...")).toBeVisible();
  await expect(drawer).toBeVisible();
}
