import { RuleTester } from "eslint";
import { describe, it } from "vitest";

import { servicesReadNeverWritesRule } from "./services-read-never-writes.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: "module" },
});

const SERVICES = "/repo/apps/web/src/app/_domains/billing/_services";

ruleTester.run("services-read-never-writes", servicesReadNeverWritesRule, {
  valid: [
    {
      name: "a read service that only reads",
      filename: `${SERVICES}/get-plan.ts`,
      code: `export function getPlan() { return db.plan.findFirst(); }\n`,
    },
    {
      name: "a read service running a read-only raw query",
      filename: `${SERVICES}/count-plans.ts`,
      code: "export function countPlans() { return db.$queryRaw`select 1`; }\n",
    },
    {
      name: "a write service that writes",
      filename: `${SERVICES}/create-plan.ts`,
      code: `export function createPlan() { return db.plan.create({}); }\n`,
    },
    {
      name: "an upsert service that upserts",
      filename: `${SERVICES}/upsert-plan.ts`,
      code: `export function upsertPlan() { return prisma.plan.upsert({}); }\n`,
    },
    {
      name: "a hash digest, whose `update` is not a database write",
      filename: `${SERVICES}/find-token.ts`,
      code: `export function findToken(raw) { return crypto.createHash("sha256").update(raw).digest("hex"); }\n`,
    },
    {
      name: "a cookie deleted off a response",
      filename: `${SERVICES}/get-session.ts`,
      code: `export function getSession(response) { response.cookies.delete("state"); }\n`,
    },
    {
      name: "a read service calling a write service",
      filename: `${SERVICES}/get-plan.ts`,
      code: `import { touchPlan } from "./touch-plan";\nexport function getPlan() { touchPlan(); }\n`,
    },
    {
      name: "a test that seeds the rows it reads back",
      filename: `${SERVICES}/get-plan.test.ts`,
      code: `it("reads", async () => { await db.plan.create({}); });\n`,
    },
    {
      name: "a module outside a services folder",
      filename: "/repo/apps/web/src/app/_domains/billing/_helpers/get-plan.ts",
      code: `export function getPlan() { return db.plan.update({}); }\n`,
    },
    {
      name: "a verb the options do not call a read",
      filename: `${SERVICES}/find-plan.ts`,
      code: `export function findPlan() { return db.plan.update({}); }\n`,
      options: [{ readVerbs: ["get"] }],
    },
  ],
  invalid: [
    {
      name: "a find service that updates a row",
      filename: `${SERVICES}/find-agent-token.ts`,
      code: `export function findAgentToken() { return prisma.agentToken.update({}); }\n`,
      errors: [
        {
          messageId: "readWrites",
          data: {
            basename: "find-agent-token.ts",
            verb: "find",
            method: "update",
          },
        },
      ],
    },
    {
      name: "a get service that creates a row",
      filename: `${SERVICES}/get-or-create-reviewer.ts`,
      code: `export function getOrCreateReviewer(db) { return db.reviewer.create({}); }\n`,
      errors: [{ messageId: "readWrites" }],
    },
    {
      name: "a list service deleting inside a transaction",
      filename: `${SERVICES}/list-plans.ts`,
      code: `export function listPlans() { return db.$transaction([tx.plan.deleteMany({})]); }\n`,
      errors: [{ messageId: "readWrites" }],
    },
    {
      name: "a read service running a raw write",
      filename: `${SERVICES}/count-plans.ts`,
      code: "export function countPlans() { return db.$executeRaw`delete from plan`; }\n",
      errors: [{ messageId: "readWrites" }],
    },
    {
      name: "a read verb added through the options",
      filename: `${SERVICES}/fetch-plan.ts`,
      code: `export function fetchPlan() { return db.plan.delete({}); }\n`,
      options: [{ readVerbs: ["fetch"] }],
      errors: [{ messageId: "readWrites" }],
    },
  ],
});
