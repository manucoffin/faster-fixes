// The service return type is the type source of truth (ADR-0011, server file
// conventions): a read service exports it as `<Service>Output`, and a consumer
// imports that alias instead of inferring the shape from the tRPC procedure.
//
// The rule checks both halves of that convention:
//
//   1. the producer — a read service (`_services/<read-verb>-*.ts`) exports
//      `export type <Service>Output = Awaited<ReturnType<typeof <service>>>`,
//      where `<service>` is the file's own service. An alias derived from some
//      other function's `ReturnType`, or one under a different name, does not
//      satisfy it;
//   2. the consumer — `inferProcedureOutput` and `inferRouterOutputs` are the
//      inference the convention replaces, so a type built from either is
//      reported wherever it appears.
//
// The expected names come from the basename, because a service file is named
// after its export (`services-verb-prefix` holds the two together). They are
// compared case-insensitively for the same reason that rule compares its export
// name that way: a kebab basename cannot carry the house spelling of a proper
// noun, so `get-github-installation.ts` exports `GetGitHubInstallationOutput`.

const SERVICES_PATH_RE = /(^|\/)_services\//;
// Reads only: a write has no output alias to derive. This is the closed read
// vocabulary of ADR-0011, `count-` included.
const READ_VERBS = ["count", "find", "get", "has", "is", "list", "search"];
// Files in `_services/` that are not services: the barrel, a schema, an Inngest
// job, a private helper, a test.
const EXEMPT_BASENAME_RE =
  /(?:\.test\.tsx?$|\.spec\.tsx?$|\.schema\.tsx?$|\.inngest\.tsx?$|^index\.tsx?$|^_)/;

// The inference this convention replaces, under whatever local name it is
// imported: the alias is what a consumer would write the type with.
const INFERENCE_HELPERS = ["inferProcedureOutput", "inferRouterOutputs"];

const OUTPUT_SUFFIX = "Output";

function stripExtension(basename) {
  return basename.replace(/\.tsx?$/, "");
}

function camelCaseOf(basename) {
  return stripExtension(basename).replace(/-([a-z0-9])/g, (_, character) =>
    character.toUpperCase(),
  );
}

function pascalCaseOf(camel) {
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function sameName(one, other) {
  return one.toLowerCase() === other.toLowerCase();
}

/**
 * The `typeof X` target of a `ReturnType<typeof X>` anywhere in a type
 * annotation, so the wrappers the convention allows (`Awaited<…>`, an indexed
 * access, a `NonNullable<…>`) do not hide it.
 */
function returnTypeTargetOf(node) {
  if (!node || typeof node !== "object") return null;

  if (
    node.type === "TSTypeReference" &&
    node.typeName?.type === "Identifier" &&
    node.typeName.name === "ReturnType"
  ) {
    const typeArgs = node.typeArguments || node.typeParameters;
    const first = typeArgs?.params?.[0];
    if (
      first?.type === "TSTypeQuery" &&
      first.exprName?.type === "Identifier"
    ) {
      return first.exprName.name;
    }
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") continue;
    const value = node[key];
    const children = Array.isArray(value) ? value : [value];
    for (const child of children) {
      if (child && typeof child.type === "string") {
        const target = returnTypeTargetOf(child);
        if (target) return target;
      }
    }
  }
  return null;
}

export const requireServiceOutputTypeRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A read service in _services/ exports its return type as `<Service>Output` built from `typeof` its own service, and no consumer infers that type from the tRPC router.",
    },
    schema: [],
    messages: {
      missing:
        "`{{ basename }}` must export its return type as `{{ output }}`: `export type {{ output }} = Awaited<ReturnType<typeof {{ service }}>>;`. The service return type is the type source of truth, not `inferProcedureOutput` (ADR-0011).",
      wrongName:
        "`{{ exported }}` is derived from `typeof {{ service }}` but is not named `{{ output }}`. Rename it: `export type {{ output }} = Awaited<ReturnType<typeof {{ service }}>>;` (ADR-0011).",
      consumerInference:
        "`{{ helper }}` infers the output type from the tRPC router. Import `<Service>Output` from the service file instead: the service return type is the type source of truth (ADR-0011).",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    const basename = filename.split("/").pop() || "";

    // A local name bound to one of the inference helpers, so that importing it
    // under an alias is not a way around the consumer half.
    const inferenceNames = new Set(INFERENCE_HELPERS);
    const inferenceUses = [];

    const consumerVisitors = {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          if (INFERENCE_HELPERS.includes(specifier.imported.name)) {
            inferenceNames.add(specifier.local.name);
          }
        }
      },
      TSTypeReference(node) {
        if (node.typeName?.type !== "Identifier") return;
        inferenceUses.push(node);
      },
    };

    function reportInferenceUses() {
      for (const node of inferenceUses) {
        if (!inferenceNames.has(node.typeName.name)) continue;
        context.report({
          node,
          messageId: "consumerInference",
          data: { helper: node.typeName.name },
        });
      }
    }

    const isService =
      SERVICES_PATH_RE.test(filename) &&
      !EXEMPT_BASENAME_RE.test(basename) &&
      READ_VERBS.some((verb) =>
        stripExtension(basename).startsWith(`${verb}-`),
      );

    if (!isService) {
      return {
        ...consumerVisitors,
        "Program:exit"() {
          reportInferenceUses();
        },
      };
    }

    const service = camelCaseOf(basename);
    const output = `${pascalCaseOf(service)}${OUTPUT_SUFFIX}`;

    // Every type alias of the file, by name, with the `typeof` target it is
    // derived from. The export check is separate because the convention accepts
    // both `export type X = …` and a later `export type { X }`.
    const aliases = new Map();
    const exportedNames = new Set();
    // A retired service keeps its filename as an empty `export {}` placeholder,
    // because agents may not delete files. It exports no function, so there is
    // no return type to derive and nothing for this rule to ask for.
    let hasAnyExport = false;

    function collectAlias(node) {
      aliases.set(node.id.name, {
        node,
        target: returnTypeTargetOf(node.typeAnnotation),
      });
    }

    return {
      ...consumerVisitors,
      TSTypeAliasDeclaration(node) {
        collectAlias(node);
      },
      ExportNamedDeclaration(node) {
        if (node.declaration || node.specifiers.length > 0) hasAnyExport = true;
        if (node.declaration?.type === "TSTypeAliasDeclaration") {
          exportedNames.add(node.declaration.id.name);
        }
        // `export type { X }` and `export { type X }` re-export a local alias,
        // but `export … from` names another module's type.
        if (node.source) return;
        for (const specifier of node.specifiers) {
          exportedNames.add(specifier.local.name);
        }
      },
      ExportDefaultDeclaration() {
        hasAnyExport = true;
      },
      ExportAllDeclaration() {
        hasAnyExport = true;
      },
      "Program:exit"(program) {
        reportInferenceUses();
        if (!hasAnyExport) return;

        const derived = [...aliases.entries()].filter(
          ([name, alias]) =>
            exportedNames.has(name) &&
            alias.target !== null &&
            sameName(alias.target, service),
        );

        if (derived.some(([name]) => sameName(name, output))) return;

        if (derived.length > 0) {
          const [name, alias] = derived[0];
          context.report({
            node: alias.node.id,
            messageId: "wrongName",
            data: { exported: name, service, output },
          });
          return;
        }

        // The alias carrying the expected name but the wrong source is where
        // the edit goes, so the report points at it rather than at the file.
        const misSourced = [...aliases.entries()].find(
          ([name]) => exportedNames.has(name) && sameName(name, output),
        );

        context.report({
          node: misSourced ? misSourced[1].node.id : program,
          messageId: "missing",
          data: { basename, service, output },
        });
      },
    };
  },
};
