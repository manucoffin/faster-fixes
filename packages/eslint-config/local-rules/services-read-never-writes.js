// A read verb is a promise: `get-`, `list-`, `find-`, `search-`, `has-`, `is-`
// and `count-` say the service performs no write (ADR-0011, backend.md). The
// verb prefix rule checks that a service name carries one of those verbs; this
// rule checks that the name is true, by reading what the file does to the
// database.
//
// The check is deliberately narrow: a Prisma write method called on a model of
// a database client. That is the one form the tree writes in, and it is the
// form a reader of a read service does not expect to find.
//
// Narrow both ways. `crypto.createHash(…).update(token)` is not a database
// write, and neither is `response.cookies.delete(name)`: the receiver has to be
// a database client, which is why the method alone is not the signal. And a
// read service that calls a write *service* is not reported here, because the
// other service carries its own verb and its own report.
//
// The read verbs are the closed list the verb prefix rule declares, imported
// rather than copied, and the shared config passes the same list to both rules
// as an option. One list, two consumers, so a verb cannot mean "read" to one
// rule and not to the other.

import { SERVICE_READ_VERBS } from "./services-verb-prefix.js";

const SERVICES_PATH_RE = /(^|\/)_services\//;

// Not verb-prefixed operations by kind rather than by name, so the promise a
// read verb makes is not theirs to keep: the barrel, a schema, an Inngest job,
// a private helper, a test that seeds the rows it reads back.
const EXEMPT_BASENAME_RE =
  /(?:\.schema\.tsx?$|\.inngest\.tsx?$|^index\.tsx?$|^_|\.test\.tsx?$|\.spec\.tsx?$)/;

const VERB_PREFIX_RE = /^([a-z][a-z0-9]*)-/;

// The names a Prisma client answers to in this tree: the package export, the
// injected client a service takes for its tests, and the transaction client.
const DATABASE_IDENTIFIERS = ["db", "prisma", "tx"];

// Called on a model: `db.feedback.create(…)`.
const MODEL_WRITE_METHODS = [
  "create",
  "createMany",
  "createManyAndReturn",
  "delete",
  "deleteMany",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
];

// Called on the client itself: `db.$executeRaw` writes, `$queryRaw` reads.
const CLIENT_WRITE_METHODS = ["$executeRaw", "$executeRawUnsafe"];

function propertyName(node) {
  if (node.computed) return null;
  return node.property.type === "Identifier" ? node.property.name : null;
}

function isDatabaseIdentifier(node) {
  return node.type === "Identifier" && DATABASE_IDENTIFIERS.includes(node.name);
}

export const servicesReadNeverWritesRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A service in _services/ named with a read verb performs no database write.",
    },
    schema: [
      {
        type: "object",
        properties: {
          readVerbs: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      readWrites:
        "`{{ basename }}` is named with the read verb `{{ verb }}-`, which promises it performs no write, but it calls `.{{ method }}()` on the database. Rename the service with a write verb, or split the write into its own `<write verb>-<entity>` service and call it from the caller.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!SERVICES_PATH_RE.test(filename)) return {};

    const basename = filename.split("/").pop() || "";
    if (EXEMPT_BASENAME_RE.test(basename)) return {};

    const readVerbs = context.options[0]?.readVerbs || SERVICE_READ_VERBS;

    const verb = VERB_PREFIX_RE.exec(basename)?.[1];
    if (!verb || !readVerbs.includes(verb)) return {};

    function report(node, method) {
      context.report({
        node,
        messageId: "readWrites",
        data: { basename, verb, method },
      });
    }

    return {
      MemberExpression(node) {
        const method = propertyName(node);
        if (!method) return;

        if (
          CLIENT_WRITE_METHODS.includes(method) &&
          isDatabaseIdentifier(node.object)
        ) {
          report(node.property, method);
          return;
        }

        // `db.feedback.create`: the receiver is a model read off a database
        // client, which is what separates a Prisma write from `map.delete(k)`.
        if (
          MODEL_WRITE_METHODS.includes(method) &&
          node.object.type === "MemberExpression" &&
          isDatabaseIdentifier(node.object.object) &&
          propertyName(node.object)
        ) {
          report(node.property, method);
        }
      },
    };
  },
};
