const USE_CLIENT_RE = /^['"]use client['"]/;
const CLIENT_SUFFIX_RE = /\.client\.tsx$/;
// Hooks and context files legitimately use 'use client' without the .client.tsx suffix
const EXEMPT_FILENAME_RE = /(?:^use-[a-z].*\.ts$|\.context\.tsx$)/;

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
        "This file has a `'use client'` directive but its name does not end with `.client.tsx`. Rename it to `{{ suggested }}`.",
      missingUseClient:
        "This file is named `.client.tsx` but is missing the `'use client'` directive at the top.",
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

    const hasClientSuffix = CLIENT_SUFFIX_RE.test(filename);
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
          const suggested = basename.replace(/\.tsx$/, ".client.tsx");
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
