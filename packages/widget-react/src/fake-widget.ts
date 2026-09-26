import { vi } from "vitest";
import type { Mock } from "vitest";
import type { Widget } from "@fasterfixes/widget";

type FeedbackItem = Widget["feedbackItems"][number];

type WidgetState = {
  isVisible?: boolean;
  feedbackItems?: readonly FeedbackItem[];
  showPins?: boolean;
};

export type FakeWidget = Widget & {
  show: Mock<() => void>;
  hide: Mock<() => void>;
  startAnnotation: Mock<() => void>;
  togglePins: Mock<() => void>;
  destroy: Mock<() => void>;
  emit: (patch: WidgetState) => void;
  readonly listenerCount: number;
};

/** A Widget double for tests: every method is a spy and `emit` notifies subscribers. */
export function createFakeWidget(): FakeWidget {
  const listeners = new Set<() => void>();
  let isVisible = true;
  let feedbackItems: readonly FeedbackItem[] = [];
  let showPins = true;

  const emit = (patch: WidgetState) => {
    isVisible = patch.isVisible ?? isVisible;
    feedbackItems = patch.feedbackItems ?? feedbackItems;
    showPins = patch.showPins ?? showPins;
    [...listeners].forEach((listener) => listener());
  };

  return {
    show: vi.fn(),
    hide: vi.fn(),
    get isVisible() {
      return isVisible;
    },
    startAnnotation: vi.fn(),
    get feedbackItems() {
      return feedbackItems;
    },
    togglePins: vi.fn(),
    get showPins() {
      return showPins;
    },
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    destroy: vi.fn(() => {
      listeners.clear();
    }),
    emit,
    get listenerCount() {
      return listeners.size;
    },
  };
}
