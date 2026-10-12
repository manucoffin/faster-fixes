import assert from "node:assert/strict";
import { test } from "node:test";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { createDatabaseAdapter } from "./adapter";

const DATABASE_URL = "postgresql://user:password@localhost:5432/fasterfixes";
const NEON_DATABASE_URL =
  "postgresql://user:password@ep-example.eu-central-1.aws.neon.tech/fasterfixes";

test("production defaults to standard PostgreSQL", () => {
  assert.ok(
    createDatabaseAdapter({ DATABASE_URL, NODE_ENV: "production" }) instanceof
      PrismaPg,
  );
});

test("production detects Neon from its hostname", () => {
  assert.ok(
    createDatabaseAdapter({
      DATABASE_URL: NEON_DATABASE_URL,
      NODE_ENV: "production",
    }) instanceof PrismaNeon,
  );
});

test("explicit Neon selection overrides a non-Neon hostname", () => {
  assert.ok(
    createDatabaseAdapter({
      DATABASE_URL,
      DATABASE_PROVIDER: "neon",
      NODE_ENV: "production",
    }) instanceof PrismaNeon,
  );
});

test("explicit PostgreSQL selection overrides a Neon hostname", () => {
  assert.ok(
    createDatabaseAdapter({
      DATABASE_URL: NEON_DATABASE_URL,
      DATABASE_PROVIDER: "postgres",
      NODE_ENV: "production",
    }) instanceof PrismaPg,
  );
});

test("Neon text outside its hostname suffix does not select Neon", () => {
  assert.ok(
    createDatabaseAdapter({
      DATABASE_URL:
        "postgresql://neon:neon@postgres.neon-example.test:5432/neon",
      NODE_ENV: "production",
    }) instanceof PrismaPg,
  );
});

test("missing connection string falls back to PostgreSQL", () => {
  assert.ok(createDatabaseAdapter({}) instanceof PrismaPg);
});

test("invalid provider fails clearly", () => {
  assert.throws(
    () => createDatabaseAdapter({ DATABASE_URL, DATABASE_PROVIDER: "unknown" }),
    /Unsupported database provider/,
  );
});
