import { describe, expect, it } from "vitest";
import { isPlayPauseShortcut } from "./is-play-pause-shortcut";

function fakeTarget(insideSpaceOwner: boolean) {
  return {
    closest: () => (insideSpaceOwner ? {} : null),
  } as unknown as EventTarget;
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
});
