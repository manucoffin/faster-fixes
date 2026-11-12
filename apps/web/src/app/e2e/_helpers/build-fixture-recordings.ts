/**
 * Recordings for the player document's end-to-end specs, built from plain
 * rrweb events: a viewport, one snapshot of the page and a mouse move that
 * gives the Recording a duration. Every outside resource sits on
 * `FIXTURE_ASSET_ORIGIN`, which the specs answer in the browser.
 */

// Unresolvable on purpose, so a request the spec does not answer fails.
const FIXTURE_ASSET_ORIGIN = "http://assets.recording-fixture.test";

// rrweb's serialized node types and event types.
const DOCUMENT_NODE = 0;
const DOCUMENT_TYPE_NODE = 1;
const ELEMENT_NODE = 2;
const TEXT_NODE = 3;
const FULL_SNAPSHOT = 2;
const INCREMENTAL_SNAPSHOT = 3;
const META = 4;
const MOUSE_MOVE = 1;

type SerializedNode = Record<string, unknown> & { id: number };

let nextId = 1;

function element(
  tagName: string,
  attributes: Record<string, string> = {},
  childNodes: SerializedNode[] = [],
): SerializedNode {
  return { type: ELEMENT_NODE, id: nextId++, tagName, attributes, childNodes };
}

function text(textContent: string): SerializedNode {
  return { type: TEXT_NODE, id: nextId++, textContent };
}

function buildRecording(head: SerializedNode[], body: SerializedNode[]) {
  nextId = 1;
  const bodyNode = element("body", {}, body);
  const node = {
    type: DOCUMENT_NODE,
    id: nextId++,
    childNodes: [
      {
        type: DOCUMENT_TYPE_NODE,
        id: nextId++,
        name: "html",
        publicId: "",
        systemId: "",
      },
      element("html", { lang: "en" }, [element("head", {}, head), bodyNode]),
    ],
  };

  return [
    {
      type: META,
      timestamp: 1_000,
      data: {
        href: "https://customer.example/account",
        width: 1280,
        height: 720,
      },
    },
    {
      type: FULL_SNAPSHOT,
      timestamp: 1_001,
      data: { node, initialOffset: { top: 0, left: 0 } },
    },
    {
      type: INCREMENTAL_SNAPSHOT,
      timestamp: 3_000,
      data: {
        source: MOUSE_MOVE,
        positions: [{ x: 40, y: 40, id: bodyNode.id, timeOffset: 0 }],
      },
    },
  ];
}

/**
 * A page that tries every way out of the player: a script, an inline event
 * handler, a `javascript:` link, a link to a new window, a form with an action
 * and a meta refresh. Each one, if it ran, would request a `/beacon/` path.
 */
export function buildAttackRecording() {
  const beacon = (name: string) => `${FIXTURE_ASSET_ORIGIN}/beacon/${name}`;
  const run = (name: string) =>
    `document.body.setAttribute('data-ran','${name}');fetch('${beacon(name)}')`;

  return buildRecording(
    [
      element("meta", {
        "http-equiv": "refresh",
        content: `0;url=${beacon("refresh")}`,
      }),
      element("title", {}, [text("Attack")]),
    ],
    [
      element("h1", {}, [text("Attack")]),
      element("script", {}, [text(run("script"))]),
      element("details", { open: "", ontoggle: run("handler") }, [
        element("summary", {}, [text("Details")]),
      ]),
      element("a", { id: "script-link", href: `javascript:${run("link")}` }, [
        text("Script link"),
      ]),
      element(
        "a",
        { id: "window-link", href: beacon("window"), target: "_blank" },
        [text("Window link")],
      ),
      element("form", { action: beacon("form"), method: "post" }, [
        element("input", { name: "q", value: "***" }),
        element("button", { type: "submit" }, [text("Send")]),
      ]),
    ],
  );
}

/**
 * A page with an image from another host and the content the Widget's
 * recorder masks, recorded as it stores it: a typed value and `data-ff-mask`
 * text as `*`, a `data-ff-block` element as an empty box of its size. With
 * `missing`, an image or a font of the page no longer loads.
 */
export function buildPageRecording({
  missing,
}: { missing?: "image" | "font" } = {}) {
  const head = [element("title", {}, [text("Account")])];
  const body = [
    element("h1", {}, [text("Account")]),
    element("img", {
      id: "logo",
      src: `${FIXTURE_ASSET_ORIGIN}/logo.png`,
      alt: "Logo",
      width: "64",
      height: "64",
    }),
    element("label", {}, [
      text("Name "),
      element("input", { id: "name", type: "text", value: "*******" }),
    ]),
    element("p", { id: "masked", "data-ff-mask": "" }, [text("**** *****")]),
    // rrweb keeps only the class and the recorded size of a blocked element.
    element("div", { class: "blocked", rr_width: "320px", rr_height: "180px" }),
  ];

  if (missing === "image") {
    body.push(
      element("img", { src: `${FIXTURE_ASSET_ORIGIN}/missing.png`, alt: "" }),
    );
  }
  if (missing === "font") {
    head.push(
      element("style", {
        _cssText: `@font-face { font-family: Missing; src: url(${FIXTURE_ASSET_ORIGIN}/missing.woff2); } .font { font-family: Missing; }`,
      }),
    );
    body.push(element("p", { class: "font" }, [text("Set in a missing font")]));
  }

  return buildRecording(head, body);
}
