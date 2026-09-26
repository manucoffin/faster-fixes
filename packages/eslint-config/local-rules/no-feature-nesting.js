// Feature folder shape (ADR-0010, app folder architecture). A feature is a capability
// slice inside a scope, so the tree under `_features/` stays shallow: one optional
// grouping level, then the capability, then the files. A grown child capability
// promotes to a sibling, it does not nest under another feature.
//
// Underscore-prefixed folders are buckets, not capabilities, so they do not count
// toward the depth; a second `_features/` in the path is a nested feature.

const FEATURES_SEGMENT = "_features";
const MAX_GROUPING_DEPTH = 2;

function folderSegmentsUnderFeatures(filename) {
  const segments = filename.split("/");
  const featuresIndex = segments.indexOf(FEATURES_SEGMENT);
  if (featuresIndex === -1) return null;

  // Drop the basename: the rule reports on the file, it does not count it.
  return segments.slice(featuresIndex + 1, -1);
}

export const noFeatureNestingRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Under a `_features/` folder, a file sits at most at `<area>/<capability>/`, and no feature nests in another feature.",
    },
    schema: [],
    messages: {
      nestedFeature:
        "This file lives in a feature nested inside another feature. Promote the inner `_features/<x>/` to a sibling at the domain/segment level.",
      tooDeep:
        "This file is {{ depth }} capability folders deep under `_features/`. A feature allows one grouping level: `_features/<area>/<capability>/`. Flatten the folder, or promote the inner capability to a sibling feature.",
    },
  },
  create(context) {
    const folders = folderSegmentsUnderFeatures(context.filename);
    if (folders === null) return {};

    if (folders.includes(FEATURES_SEGMENT)) {
      return {
        Program(node) {
          context.report({ node, messageId: "nestedFeature" });
        },
      };
    }

    const depth = folders.filter((segment) => !segment.startsWith("_")).length;
    if (depth <= MAX_GROUPING_DEPTH) return {};

    return {
      Program(node) {
        context.report({ node, messageId: "tooDeep", data: { depth } });
      },
    };
  },
};
