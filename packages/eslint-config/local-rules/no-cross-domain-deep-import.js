// A module inside `_domains/<a>/` may only reach `_domains/<b>/` through that
// domain's public barrel, addressed by its alias (`@/app/_domains/<b>`).
// Three shapes are blocked: an alias deep path, a relative specifier that
// resolves inside another domain (at any depth, its barrel included, since a
// relative path to `index.ts` is not the public address), and the `export … from`
// forms of both, which re-export another domain's internals.

import path from "node:path";

const DOMAIN_PATH = /\/src\/app\/_domains\/([^/]+)(?:\/|$)/;
const ALIAS_PATTERN = /^@\/app\/_domains\/([^/]+)(\/.+)?$/;
const RELATIVE_PATTERN = /^\.\.?(\/|$)/;

export const noCrossDomainDeepImportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Cross-domain imports must go through the domain's public index.ts, addressed by its alias. Forbid `@/app/_domains/<other>/<deep-path>` and any relative specifier landing in another domain, in `import` and `export … from` alike.",
    },
    schema: [],
    messages: {
      crossDomainDeep:
        "Cross-domain imports must go through the public index.ts. Use `@/app/_domains/{{domain}}` instead of `@/app/_domains/{{domain}}{{deepPath}}`. If the symbol isn't exported yet, add it to `_domains/{{domain}}/index.ts`.",
      crossDomainRelative:
        "Cross-domain imports must go through the public index.ts, addressed by its alias. Use `@/app/_domains/{{domain}}` instead of `{{source}}`. If the symbol isn't exported yet, add it to `_domains/{{domain}}/index.ts`.",
    },
  },
  create(context) {
    const filename = (context.filename || context.getFilename()).replace(
      /\\/g,
      "/",
    );
    const domainMatch = filename.match(DOMAIN_PATH);
    if (!domainMatch) return {};
    const currentDomain = domainMatch[1];

    function check(node) {
      if (!node.source) return;
      const source = node.source.value;
      if (typeof source !== "string") return;

      const aliasMatch = source.match(ALIAS_PATTERN);
      if (aliasMatch) {
        const [, targetDomain, deepPath] = aliasMatch;
        if (targetDomain === currentDomain) return;
        if (!deepPath) return;
        context.report({
          node: node.source,
          messageId: "crossDomainDeep",
          data: { domain: targetDomain, deepPath },
        });
        return;
      }

      if (!RELATIVE_PATTERN.test(source)) return;
      const resolved = path.posix.resolve(path.posix.dirname(filename), source);
      const resolvedMatch = resolved.match(DOMAIN_PATH);
      if (!resolvedMatch) return;
      const targetDomain = resolvedMatch[1];
      if (targetDomain === currentDomain) return;
      context.report({
        node: node.source,
        messageId: "crossDomainRelative",
        data: { domain: targetDomain, source },
      });
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
    };
  },
};
