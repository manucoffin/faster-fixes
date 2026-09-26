// The house style has one non-negotiable about punctuation: no em dash in
// user-facing text. A comma, a colon or a period says the same thing and is
// what the serious developer tools this product reads like actually use, so a
// stray em dash marks the copy as machine-written.
//
// Three node kinds can hold text that reaches a reader: a string literal (a
// label, a title, a toast, a JSX attribute), JSX text between tags, and the
// static chunks of a template literal. A comment reaches nobody but the next
// developer, so it is not checked: the rule never visits one, and an em dash
// there is left alone on purpose.
//
// The rule does not sort user-facing strings from internal ones. A string
// literal an agent writes is copy until proven otherwise, and an internal
// string has no use for the character either, so the cheap test is also the
// correct one.
//
// MDX is out of reach, because ESLint cannot parse it. `src/mdx-no-em-dash.test.ts`
// reads those files directly and fails on the same character.
//
// The pattern is built from the character's code point rather than written
// out, so that the file banning the character is not also the one file of the
// package carrying it. `src/mdx-no-em-dash.test.ts` builds its own the same
// way, and for the same reason.

const EM_DASH_RE = new RegExp(String.fromCodePoint(0x2014));

export const noEmDashInCopyRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "User-facing text uses a comma, a colon or a period rather than an em dash.",
    },
    schema: [],
    messages: {
      emDash:
        "User-facing text carries an em dash. Replace it with a comma, a colon or a period, whichever reads correctly in the sentence. A comment is not user-facing and may keep one.",
    },
  },
  create(context) {
    function reportIfEmDash(node, text) {
      if (typeof text !== "string") return;
      if (!EM_DASH_RE.test(text)) return;
      context.report({ node, messageId: "emDash" });
    }

    return {
      Literal(node) {
        reportIfEmDash(node, node.value);
      },
      JSXText(node) {
        reportIfEmDash(node, node.value);
      },
      // The cooked chunk, which is what the value of a string literal is too,
      // so that an escaped spelling of the character is read as the character.
      // It is `undefined` for an invalid escape sequence, and the raw text is
      // then the only thing there is to read.
      TemplateElement(node) {
        reportIfEmDash(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};
