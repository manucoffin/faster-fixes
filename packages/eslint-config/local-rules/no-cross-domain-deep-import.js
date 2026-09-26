// A module inside `_domains/<a>/` may only reach `_domains/<b>/` through that
// domain's public barrel, addressed by its alias (`@/app/_domains/<b>`). This
// is the domain encapsulation ADR-0010 draws: every domain exposes one public
// surface and other domains may import that path and no other.
// Three shapes are blocked: an alias deep path, a relative specifier that
// resolves inside another domain (at any depth, its barrel included, since a
// relative path to `index.ts` is not the public address), and any of the four
// import forms carrying either, `export … from`, `export *` and dynamic
// `import()` included.
//
// A type-only import is reported like a value one: the barrel is the public
// address of a domain for types as much as for values, and nothing here is
// about what reaches a bundle.

import { importVisitors, filenameOf } from "./imports.js";

const DOMAIN_PATH = /\/src\/app\/_domains\/([^/]+)(?:\/|$)/;
const ALIAS_PATTERN = /^@\/app\/_domains\/([^/]+)(\/.+)?$/;

export const noCrossDomainDeepImportRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Cross-domain imports must go through the domain's public index.ts, addressed by its alias. Forbid `@/app/_domains/<other>/<deep-path>` and any relative specifier landing in another domain, in `import`, `export … from` and dynamic `import()` alike.",
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
    const filename = filenameOf(context);
    const domainMatch = filename.match(DOMAIN_PATH);
    if (!domainMatch) return {};
    const currentDomain = domainMatch[1];

    return importVisitors(context, (reference) => {
      // A relative specifier is judged on where it lands, so the barrel of
      // another domain is rejected too: its public address is the alias.
      if (reference.isRelative) {
        const resolvedMatch = reference.resolvedPath.match(DOMAIN_PATH);
        if (!resolvedMatch) return;
        const targetDomain = resolvedMatch[1];
        if (targetDomain === currentDomain) return;
        context.report({
          node: reference.node,
          messageId: "crossDomainRelative",
          data: { domain: targetDomain, source: reference.source },
        });
        return;
      }

      const aliasMatch = reference.source.match(ALIAS_PATTERN);
      if (!aliasMatch) return;
      const [, targetDomain, deepPath] = aliasMatch;
      if (targetDomain === currentDomain) return;
      if (!deepPath) return;
      context.report({
        node: reference.node,
        messageId: "crossDomainDeep",
        data: { domain: targetDomain, deepPath },
      });
    });
  },
};
