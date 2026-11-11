import { z } from "zod";

// The page as a Recording holds it: rrweb's serialized nodes, keyed by node id,
// kept current by full snapshots and mutations so a step can name the element
// it acted on at the moment it happened.

// rrweb-snapshot's NodeType values.
const ELEMENT_NODE = 2;
const TEXT_NODE = 3;

type SerializedNode = {
  id: number;
  type: number;
  tagName?: string;
  attributes?: Record<string, unknown>;
  textContent?: string;
  childNodes?: SerializedNode[];
};

export const SerializedNodeSchema: z.ZodType<SerializedNode> = z.lazy(() =>
  z.looseObject({
    id: z.number(),
    type: z.number(),
    tagName: z.string().optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),
    textContent: z.string().optional(),
    childNodes: z.array(SerializedNodeSchema).optional(),
  }),
);

export const MutationSchema = z.looseObject({
  adds: z.array(
    z.looseObject({
      parentId: z.number(),
      nextId: z.number().nullable().optional(),
      node: SerializedNodeSchema,
    }),
  ),
  removes: z.array(z.looseObject({ id: z.number() })),
  texts: z.array(
    z.looseObject({ id: z.number(), value: z.string().nullable() }),
  ),
  attributes: z.array(
    z.looseObject({
      id: z.number(),
      attributes: z.record(z.string(), z.unknown()),
    }),
  ),
});

type Mutation = z.infer<typeof MutationSchema>;

type TreeNode = {
  id: number;
  type: number;
  tagName: string;
  attributes: Record<string, unknown>;
  textContent: string;
  parentId: number | null;
  childIds: number[];
};

// What the Widget's recorder writes for a masked character (rrweb's default).
const MASKED_ONLY = /^[\s*]+$/;
const LABEL_MAX_LENGTH = 50;
// A CSS identifier needing no escape; anything else is left out of a selector.
const PLAIN_IDENTIFIER = /^-?[A-Za-z_][\w-]*$/;
const SELECTOR_MAX_PARTS = 5;
const NON_TEXT_TAGS = new Set(["script", "style", "noscript"]);

export function createRecordingTree() {
  const nodes = new Map<number, TreeNode>();

  function insert(node: SerializedNode, parentId: number | null) {
    nodes.set(node.id, {
      id: node.id,
      type: node.type,
      tagName: node.tagName?.toLowerCase() ?? "",
      attributes: { ...node.attributes },
      textContent: node.textContent ?? "",
      parentId,
      childIds: (node.childNodes ?? []).map((child) => child.id),
    });
    for (const child of node.childNodes ?? []) insert(child, node.id);
  }

  function remove(id: number) {
    const node = nodes.get(id);
    if (!node) return;
    for (const childId of node.childIds) remove(childId);
    nodes.delete(id);
  }

  function detach(id: number) {
    const parentId = nodes.get(id)?.parentId;
    const parent = parentId == null ? undefined : nodes.get(parentId);
    if (parent) parent.childIds = parent.childIds.filter((c) => c !== id);
  }

  function attribute(node: TreeNode, name: string) {
    const value = node.attributes[name];
    return typeof value === "string" && value.trim() !== "" ? value : null;
  }

  function isElement(node: TreeNode | undefined): node is TreeNode {
    return node?.type === ELEMENT_NODE;
  }

  // rrweb keeps a blocked element as a sized placeholder with no content.
  function isBlocked(node: TreeNode) {
    return "rr_width" in node.attributes;
  }

  function textOf(node: TreeNode): string {
    if (node.type === TEXT_NODE) return node.textContent;
    if (NON_TEXT_TAGS.has(node.tagName) || isBlocked(node)) return "";
    return node.childIds
      .map((id) => nodes.get(id))
      .map((child) => (child ? textOf(child) : ""))
      .join("");
  }

  function parentElementOf(node: TreeNode) {
    const parent = node.parentId == null ? undefined : nodes.get(node.parentId);
    return isElement(parent) ? parent : null;
  }

  // The outermost blocked ancestor stands for anything inside it.
  function nameableElement(id: number) {
    let node = nodes.get(id);
    if (node?.type === TEXT_NODE) node = nodes.get(node.parentId ?? -1);
    if (!isElement(node)) return null;
    let named = node;
    for (let at = parentElementOf(node); at; at = parentElementOf(at)) {
      if (isBlocked(at)) named = at;
    }
    return named;
  }

  // Built like the Widget's element description: tag, type, role, then name.
  function labelOf(node: TreeNode) {
    let label = node.tagName;
    const type = attribute(node, "type");
    if (type && node.tagName === "input") label += `[type="${type}"]`;
    const role = attribute(node, "role");
    if (role) label += `[role="${role}"]`;
    const name = (
      attribute(node, "aria-label") ??
      attribute(node, "placeholder") ??
      attribute(node, "alt") ??
      attribute(node, "title") ??
      textOf(node)
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, LABEL_MAX_LENGTH);
    if (name && !MASKED_ONLY.test(name)) label += ` "${name}"`;
    return label;
  }

  function selectorPart(node: TreeNode, parent: TreeNode | null) {
    let part = node.tagName;
    const classes = (attribute(node, "class") ?? "")
      .split(/\s+/)
      .filter((name) => PLAIN_IDENTIFIER.test(name))
      .slice(0, 2);
    if (classes.length > 0) part += `.${classes.join(".")}`;
    const sameTag = (parent?.childIds ?? [])
      .map((id) => nodes.get(id))
      .filter((sibling) => sibling?.tagName === node.tagName);
    if (sameTag.length > 1) {
      part += `:nth-of-type(${sameTag.findIndex((s) => s?.id === node.id) + 1})`;
    }
    return part;
  }

  // From the element up to the nearest id or to the body, nearest parts kept.
  function selectorOf(node: TreeNode) {
    const parts: string[] = [];
    for (
      let at: TreeNode | null = node;
      at && parts.length < SELECTOR_MAX_PARTS;
      at = parentElementOf(at)
    ) {
      const id = attribute(at, "id");
      if (id && PLAIN_IDENTIFIER.test(id)) {
        parts.unshift(`#${id}`);
        break;
      }
      if (at.tagName === "body" || at.tagName === "html") {
        if (parts.length === 0) parts.push(at.tagName);
        break;
      }
      parts.unshift(selectorPart(at, parentElementOf(at)));
    }
    return parts.join(" > ");
  }

  return {
    applyFullSnapshot(node: SerializedNode) {
      nodes.clear();
      insert(node, null);
    },

    // In the order rrweb's player applies them: removes, adds, texts, attributes.
    applyMutation(mutation: Mutation) {
      for (const { id } of mutation.removes) {
        detach(id);
        remove(id);
      }
      // An add may name a parent or a sibling added later in the same batch.
      let pending = mutation.adds;
      while (pending.length > 0) {
        const waiting = pending.filter(({ parentId, nextId, node }) => {
          const parent = nodes.get(parentId);
          if (!parent) return true;
          if (nextId != null && !nodes.has(nextId)) return true;
          detach(node.id);
          remove(node.id);
          insert(node, parentId);
          const at = nextId == null ? -1 : parent.childIds.indexOf(nextId);
          if (at === -1) parent.childIds.push(node.id);
          else parent.childIds.splice(at, 0, node.id);
          return false;
        });
        if (waiting.length === pending.length) {
          // Siblings that never arrive: append rather than drop the node.
          pending = waiting.map((add) => ({ ...add, nextId: null }));
          if (waiting.every((add) => add.nextId == null)) break;
        } else {
          pending = waiting;
        }
      }
      for (const { id, value } of mutation.texts) {
        const node = nodes.get(id);
        if (node) node.textContent = value ?? "";
      }
      for (const { id, attributes } of mutation.attributes) {
        const node = nodes.get(id);
        if (!node) continue;
        for (const [name, value] of Object.entries(attributes)) {
          if (value === null) delete node.attributes[name];
          else node.attributes[name] = value;
        }
      }
    },

    /** Label and selector of a node; both null when the file cannot name it. */
    describe(id: number) {
      const node = nameableElement(id);
      if (!node) return { label: null, selector: null };
      return { label: labelOf(node), selector: selectorOf(node) };
    },
  };
}
