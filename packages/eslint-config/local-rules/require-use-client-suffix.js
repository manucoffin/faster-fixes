import { isClientFilename } from "./imports.js";

const USE_CLIENT_RE = /^['"]use client['"]/;
// Hooks and context files legitimately use 'use client' without the .client.tsx suffix.
// Hooks are `use-*.ts` (or `use-*.tsx` when they also export a JSX provider) and never
// carry the `.client` suffix (ADR-0010, app folder architecture); `.client.tsx`
// is reserved for components.
const EXEMPT_FILENAME_RE = /(?:^use-[a-z][\w-]*\.tsx?$|\.context\.tsx$)/;

export const requireUseClientSuffixRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Files with 'use client' directive must have a .client.tsx suffix, and .client.tsx files must have the directive",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignorePathPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingClientSuffix:
        "This file has a `'use client'` directive but its name does not carry the `.client` suffix. Rename it to `{{ suggested }}`.",
      missingUseClient:
        "This file is named `.client.ts(x)` but is missing the `'use client'` directive at the top.",
    },
  },
  create(context) {
    const filename = context.filename;
    const [{ ignorePathPatterns = [] } = {}] = context.options;

    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    // Read through the shared helper, so this rule and the client/server
    // import rules agree on what carries the client suffix: `.client.ts` as
    // well as `.client.tsx`.
    const hasClientSuffix = isClientFilename(filename);
    const basename = filename.split("/").pop() || "";
    const isExemptFilename = EXEMPT_FILENAME_RE.test(basename);

    return {
      Program(node) {
        const firstStatement = node.body[0];
        const hasUseClient =
          firstStatement &&
          firstStatement.type === "ExpressionStatement" &&
          firstStatement.expression.type === "Literal" &&
          USE_CLIENT_RE.test(firstStatement.expression.raw);

        if (hasUseClient && !hasClientSuffix && !isExemptFilename) {
          // Keep the file's own extension: a `.ts` module renamed to
          // `.client.tsx` would be a rename the reader cannot make, and
          // `.client.ts` is a client module to the import rules too.
          const suggested = basename.replace(/\.(tsx?)$/, ".client.$1");
          context.report({
            node: firstStatement,
            messageId: "missingClientSuffix",
            data: { suggested },
          });
        }

        if (hasClientSuffix && !hasUseClient) {
          context.report({
            node,
            messageId: "missingUseClient",
          });
        }
      },
    };
  },
};
