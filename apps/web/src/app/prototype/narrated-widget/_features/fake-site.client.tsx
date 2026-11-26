"use client";

// PROTOTYPE, throwaway (issue 491): a stand-in customer site for the real
// Widget. Its links are plain anchors, so each one is a full page load.
import type {
  CreateFeedbackData,
  FeedbackClient,
  FeedbackItem,
} from "@fasterfixes/core";
import { createWidget } from "@fasterfixes/widget/internal";
import { useEffect } from "react";

const STORAGE_KEY = "ff-proto-narrated-feedback";
const BASE = "/prototype/narrated-widget";

function readItems(): FeedbackItem[] {
  try {
    return JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEY) ?? "[]",
    ) as FeedbackItem[];
  } catch {
    return [];
  }
}

function writeItems(items: FeedbackItem[]) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const client: FeedbackClient = {
  getConfig: async () => ({ enabled: true, branding: false }),
  getFeedback: async () => ({ feedback: readItems() }),
  async createFeedback(data: CreateFeedbackData) {
    const item: FeedbackItem = {
      id: `proto-${Date.now().toString(36)}`,
      status: "new",
      comment: data.comment,
      pageUrl: data.pageUrl,
      clickX: data.clickX ?? null,
      clickY: data.clickY ?? null,
      selector: data.selector ?? null,
      screenshotUrl: null,
      reviewer: { id: "proto", name: "You" },
      createdAt: new Date().toISOString(),
      metadata: data.metadata ?? null,
    };
    writeItems([...readItems(), item]);
    return item;
  },
  async updateFeedback(id, data) {
    writeItems(
      readItems().map((item) =>
        item.id === id ? { ...item, comment: data.comment } : item,
      ),
    );
    return { id, comment: data.comment, updatedAt: new Date().toISOString() };
  },
  async deleteFeedback(id) {
    writeItems(readItems().filter((item) => item.id !== id));
  },
  attachScreenshot: async () => {},
};

const PAGES = [
  { key: "catalog", label: "Catalog" },
  { key: "cart", label: "Cart" },
  { key: "checkout", label: "Checkout" },
];

const PRODUCTS = [
  { name: "Field notebook", price: "EUR 14", stock: "In stock" },
  { name: "Brass ruler, 30 cm", price: "EUR 22", stock: "In stock" },
  { name: "Drafting pencil set", price: "EUR 18", stock: "2 left" },
  { name: "Canvas tool roll", price: "EUR 36", stock: "Out of stock" },
];

type FakeSiteProps = { page: string };

export function FakeSite({ page }: FakeSiteProps) {
  useEffect(() => {
    const widget = createWidget({
      client,
      reviewerToken: "prototype",
      config: { enabled: true, branding: false },
      position: "bottom-right",
    });
    return () => widget.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-muted text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-background px-8 py-4">
        <span className="text-lg font-semibold">Northwind Supply</span>
        <nav className="flex gap-6 text-sm">
          {PAGES.map(({ key, label }) => (
            // A plain anchor on purpose: a full page load, mid-recording.
            <a
              key={key}
              href={`${BASE}?page=${key}`}
              className={key === page ? "font-semibold underline" : ""}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-8 py-10">
        {page === "catalog" && (
          <>
            <h1 className="mb-6 text-2xl font-semibold">Catalog</h1>
            <ul className="grid grid-cols-2 gap-4">
              {PRODUCTS.map(({ name, price, stock }) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                >
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-muted-foreground">{stock}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums">{price}</span>
                    <button
                      type="button"
                      className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background"
                    >
                      Add
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {page === "cart" && (
          <>
            <h1 className="mb-6 text-2xl font-semibold">Cart</h1>
            <div className="rounded-lg border border-border bg-background p-6">
              <p className="flex justify-between">
                <span>Field notebook, 2</span>
                <span className="tabular-nums">EUR 28</span>
              </p>
              <p className="mt-2 flex justify-between">
                <span>Brass ruler, 30 cm</span>
                <span className="tabular-nums">EUR 22</span>
              </p>
              <p className="mt-4 flex justify-between border-t border-border pt-4 font-semibold">
                <span>Total</span>
                <span className="tabular-nums">EUR 48</span>
              </p>
            </div>
          </>
        )}

        {page === "checkout" && (
          <>
            <h1 className="mb-6 text-2xl font-semibold">Checkout</h1>
            <form className="flex max-w-md flex-col gap-4 rounded-lg border border-border bg-background p-6">
              <label className="flex flex-col gap-1 text-sm">
                Email
                <input
                  type="email"
                  className="rounded-md border border-border px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Card number
                <input
                  type="text"
                  className="rounded-md border border-border px-3 py-2"
                />
              </label>
              <button
                type="button"
                className="rounded-md bg-foreground px-3 py-2 text-sm text-background"
              >
                Pay EUR 48
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
