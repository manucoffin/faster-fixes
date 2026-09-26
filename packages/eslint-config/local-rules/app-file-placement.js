// Every file under `src/app/` has one unambiguous home (ADR-0010, app folder
// architecture; ADR-0011, server file conventions). The rule walks the folders
// of a path through the tiers those decisions draw:
//
//   - the app root holds the domain-agnostic buckets and `_domains/`;
//   - `_domains/` holds one folder per domain and nothing else;
//   - a scope (a domain, or a route segment) holds the five buckets plus a
//     `trpc-router.ts` at its root. Its non-underscore children are route
//     segments at the route tier, and capability folders at the domain tier,
//     where the amendment of ADR-0010 put them at the domain root;
//   - a bucket holds files and plain subfolders (a provider, a sub-library),
//     never another bucket.
//
// Everything below `_features/` or a domain capability folder is feature
// internals: ADR-0011 lets a feature grow `_`-prefixed sub-buckets on demand,
// and `no-feature-nesting` already owns the depth of that subtree. The
// placement of `*.inngest.ts` files belongs to `require-inngest-function-placement`,
// and a test file to `test-file-placement`, so neither is judged here.

const SCOPE_BUCKETS = new Set([
  "_services",
  "_helpers",
  "_types",
  "_features",
  "_components",
]);

// ADR-0010: the root buckets are domain-agnostic and slated for extraction;
// the root tier has no `_services/`, `_helpers/`, `_types/` or `_features/`.
const ROOT_BUCKETS = new Set([
  "_components",
  "_hooks",
  "_providers",
  "_constants",
  "_domains",
]);

const DOMAINS_FOLDER = "_domains";
const FEATURES_BUCKET = "_features";
const COMPONENTS_BUCKET = "_components";
const SERVICES_BUCKET = "_services";

// CLAUDE.md: a retired file or folder keeps a `_deprecated_<old-name>` stub.
const DEPRECATED_PREFIX = "_deprecated_";

const APP_SEGMENT = "/src/app/";
const TRPC_ROUTER_RE = /^trpc-router\.tsx?$/;
const SCHEMA_RE = /\.schema\.tsx?$/;
const TEST_RE = /\.test\.tsx?$/;
const DOMAIN_ROOT_FILES = new Set(["index.ts", "trpc-router.ts"]);

const TIER_LABELS = {
  root: "the app root",
  domains: "`_domains/`",
  scope: "a domain or route scope",
  bucket: "a bucket",
};

function formatBuckets(buckets) {
  return [...buckets].map((bucket) => `\`${bucket}/\``).join(", ");
}

/**
 * Walks the folders of a path under `src/app/` and returns the first misplaced
 * `_`-prefixed folder, if any, and the tier the file itself sits in.
 */
function walk(dirs) {
  let state = "root";
  for (const dir of dirs) {
    if (dir.startsWith(DEPRECATED_PREFIX)) return { state: "free" };
    const isBucket = dir.startsWith("_");

    switch (state) {
      case "root":
        if (!isBucket) {
          state = "routeScope";
        } else if (!ROOT_BUCKETS.has(dir)) {
          return { problem: { bucket: dir, tier: "root" } };
        } else {
          state = dir === DOMAINS_FOLDER ? "domains" : "bucket";
        }
        break;
      case "domains":
        if (isBucket) return { problem: { bucket: dir, tier: "domains" } };
        state = "domainScope";
        break;
      case "domainScope":
      case "routeScope":
        if (!isBucket) {
          // A domain's plain child is a capability folder; a route's is a
          // child segment, which is a scope of its own.
          if (state === "domainScope") return { state: "free" };
          break;
        }
        if (!SCOPE_BUCKETS.has(dir)) {
          return { problem: { bucket: dir, tier: "scope" } };
        }
        if (dir === FEATURES_BUCKET) return { state: "free" };
        state = "bucket";
        break;
      case "bucket":
        if (isBucket) return { problem: { bucket: dir, tier: "bucket" } };
        break;
    }
  }
  return { state };
}

// ADR-0011 retired the role suffixes. `.server.tsx` stays a server component
// outside `_services/`, and `.server.action` stays because a module-level
// 'use server' file must carry it (require-server-action-suffix).
function isRoleSuffix(parts, index, inServices) {
  const part = parts[index];
  if (part === "trpc" || part === "query" || part === "mutation") return true;
  return inServices && part === "server" && parts[index + 1] !== "action";
}

function findRoleSuffixes(basename, inServices) {
  const [stem, ...rest] = basename.split(".");
  const extension = rest.pop();
  const kept = rest.filter(
    (_, index) => !isRoleSuffix(rest, index, inServices),
  );
  if (kept.length === rest.length) return null;
  const suffixes = rest.filter((_, index) =>
    isRoleSuffix(rest, index, inServices),
  );
  return {
    suffix: suffixes.map((part) => `.${part}`).join(""),
    suggested: [stem, ...kept, extension].join("."),
  };
}

export const appFilePlacementRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Files under `src/app/` sit where ADR-0010 and ADR-0011 put them: only the allowed `_*` buckets per tier, no bucket inside a bucket, domain folders only under `_domains/`, `trpc-router.ts` at a scope root, `*.schema.ts` inside `_services/`, flat `_components/`, and no retired role suffix.",
    },
    schema: [],
    messages: {
      unknownBucket:
        "`{{ bucket }}/` is not a bucket {{ tier }} may hold: it holds only {{ allowed }} (ADR-0010, ADR-0011). The bucket set is closed so that a path alone tells a reader what a file is; move these files into the bucket that owns them.",
      notADomainFolder:
        "`_domains/` holds one folder per domain, named after a glossary term, and nothing else (ADR-0010). Move `{{ bucket }}/` into the domain that owns it.",
      bucketInBucket:
        "`{{ bucket }}/` is a bucket inside another bucket. A bucket holds files and plain subfolders (a provider, a sub-library), never a second layer (ADR-0010, ADR-0011). Move it up to the scope root, or rename it without the leading underscore if it is a grouping folder.",
      looseDomainsFile:
        "`_domains/` holds domain folders only (ADR-0010), so a file here has no domain to belong to. Move it into the domain that owns it.",
      looseDomainRootFile:
        "A domain root holds its `index.ts` barrel, its `trpc-router.ts`, its buckets and its capability folders (ADR-0010, ADR-0011). Move `{{ basename }}` into the bucket or capability folder that owns it.",
      routerOutsideScopeRoot:
        "`trpc-router.ts` is thin transport at a scope root, the sibling of `_services/` and of the route's `page.tsx` (ADR-0011). Inside a bucket or a capability it hides the scope's API from the router tree; move it up to the domain or route segment root.",
      schemaOutsideServices:
        "A `*.schema.ts` lives in the scope's `_services/` folder, beside the operation whose input it validates (ADR-0011). Move this schema there.",
      retiredRoleSuffix:
        "`{{ suffix }}` is a retired role suffix: the folder says what a file is and the verb prefix says whether it writes, so a file is plain-named after its export (ADR-0011). Rename it to `{{ suggested }}`.",
      nestedComponentLibrary:
        "`_components/` is flat, and its only subfolders are sub-libraries that are flat themselves (ADR-0010). Move this file up into `_components/{{ library }}/`.",
      componentWrapperFolder:
        "`_components/` is flat: a component is one file, never a folder named after it (ADR-0010). Move `{{ basename }}` and its siblings up into the `_components/` folder.",
    },
  },
  create(context) {
    const path = (context.filename || "").replace(/\\/g, "/");
    const appIndex = path.lastIndexOf(APP_SEGMENT);
    if (appIndex === -1) return {};

    const dirs = path.slice(appIndex + APP_SEGMENT.length).split("/");
    const basename = dirs.pop() || "";
    const isTest = TEST_RE.test(basename);

    return {
      Program(node) {
        const report = (messageId, data) =>
          context.report({ node, messageId, data });
        const { problem, state } = walk(dirs);

        if (problem?.tier === "domains") {
          report("notADomainFolder", { bucket: problem.bucket });
        } else if (problem?.tier === "bucket") {
          report("bucketInBucket", { bucket: problem.bucket });
        } else if (problem) {
          report("unknownBucket", {
            bucket: problem.bucket,
            tier: TIER_LABELS[problem.tier],
            allowed: formatBuckets(
              problem.tier === "root" ? ROOT_BUCKETS : SCOPE_BUCKETS,
            ),
          });
        }

        if (!problem && !isTest) {
          if (state === "domains") report("looseDomainsFile");
          if (state === "domainScope" && !DOMAIN_ROOT_FILES.has(basename)) {
            report("looseDomainRootFile", { basename });
          }
        }

        if (
          !problem &&
          TRPC_ROUTER_RE.test(basename) &&
          state !== "domainScope" &&
          state !== "routeScope"
        ) {
          report("routerOutsideScopeRoot");
        }

        if (SCHEMA_RE.test(basename) && !dirs.includes(SERVICES_BUCKET)) {
          report("schemaOutsideServices");
        }

        const roleSuffixes = findRoleSuffixes(
          basename,
          dirs.includes(SERVICES_BUCKET),
        );
        if (roleSuffixes) report("retiredRoleSuffix", roleSuffixes);

        const componentsIndex = dirs.lastIndexOf(COMPONENTS_BUCKET);
        if (componentsIndex !== -1) {
          const below = dirs.slice(componentsIndex + 1);
          if (below.length >= 2) {
            report("nestedComponentLibrary", { library: below[0] });
          } else if (
            below.length === 1 &&
            basename.split(".")[0] === below[0]
          ) {
            report("componentWrapperFolder", { basename });
          }
        }
      },
    };
  },
};
