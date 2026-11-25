import type { Page } from "@playwright/test";

type Point = { x: number; y: number };

/** Presses at `from`, moves to `to` in steps, as a Reviewer's mouse does, and releases. */
export async function dragAcross(page: Page, from: Point, to: Point) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await page.mouse.up();
}
