import { describe, expect, it } from "vitest";
import { isPlayPauseShortcut } from "./is-play-pause-shortcut";

function fakeTarget(insideSpaceOwner: boolean | Element) {
  const owner = insideSpaceOwner === true ? {} : insideSpaceOwner || null;
  return { closest: () => owner } as unknown as EventTarget;
}

function keyEvent(
  overrides: Partial<Parameters<typeof isPlayPauseShortcut>[0]> = {},
) {
  return {
    key: " ",
    repeat: false,
    defaultPrevented: false,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: fakeTarget(false),
    ...overrides,
  };
}

describe("isPlayPauseShortcut", () => {
  it("toggles on Space pressed outside a field", () => {
    expect(isPlayPauseShortcut(keyEvent())).toBe(true);
  });

  it("toggles on Space pressed on the document itself", () => {
    expect(isPlayPauseShortcut(keyEvent({ target: null }))).toBe(true);
  });

  it("ignores other keys", () => {
    expect(isPlayPauseShortcut(keyEvent({ key: "k" }))).toBe(false);
  });

  it("ignores a held key repeating", () => {
    expect(isPlayPauseShortcut(keyEvent({ repeat: true }))).toBe(false);
  });

  it("ignores a press another handler already took", () => {
    expect(isPlayPauseShortcut(keyEvent({ defaultPrevented: true }))).toBe(
      false,
    );
  });

  it("ignores Space with a modifier", () => {
    expect(isPlayPauseShortcut(keyEvent({ shiftKey: true }))).toBe(false);
    expect(isPlayPauseShortcut(keyEvent({ metaKey: true }))).toBe(false);
  });

  it("leaves Space to a field, toggle, dialog or menu", () => {
    expect(isPlayPauseShortcut(keyEvent({ target: fakeTarget(true) }))).toBe(
      false,
    );
  });

  it("toggles inside the dialog the player fills, given as its surface", () => {
    const surface = {} as Element;
    const event = keyEvent({ target: fakeTarget(surface) });
    expect(isPlayPauseShortcut(event, { surface })).toBe(true);
    // Without a surface, that dialog keeps Space, as on the Video page.
    expect(isPlayPauseShortcut(event)).toBe(false);
  });

  it("leaves Space to a field, menu or dialog within or over the surface", () => {
    const surface = {} as Element;
    expect(
      isPlayPauseShortcut(keyEvent({ target: fakeTarget(true) }), { surface }),
    ).toBe(false);
  });
});
