// No feature nested in a feature (ADR-0010, app folder architecture). The tree stays
// two deep (domain/segment -> feature); a grown child capability promotes to a
// sibling `_features/<x>/`, it does not nest under another feature. A path that
// contains `_features/` twice is a nested feature.

const NESTED_FEATURE_RE = /\/_features\/[^/]+\/(?:.*\/)?_features\//;

export const noFeatureNestingRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A _features/<x>/ folder may not contain a nested feature. Promote the child capability to a sibling _features/ folder.",
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
      nestedFeature:
        "This file lives in a feature nested inside another feature. Promote the inner `_features/<x>/` to a sibling at the domain/segment level.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!NESTED_FEATURE_RE.test(filename)) return {};

    const [{ ignorePathPatterns = [] } = {}] = context.options;
    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    return {
      Program(node) {
        context.report({ node, messageId: "nestedFeature" });
      },
    };
  },
};
