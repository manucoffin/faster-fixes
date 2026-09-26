import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { errorBoundaryRendersErrorScreenRule } from "./error-boundary-renders-error-screen.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const ROOT_BOUNDARY = "/repo/apps/web/src/app/error.tsx";
const GLOBAL_BOUNDARY = "/repo/apps/web/src/app/global-error.tsx";
const NESTED_BOUNDARY = "/repo/apps/web/src/app/(authenticated)/error.tsx";

const boundary = (body) => `"use client";

import { ErrorScreen } from "@/app/_components/error-screen";
import { useEffect } from "react";

export default function Boundary({ error, retry }: { error: Error; retry: () => void }) {
${body}
}
`;

const LOGS_AND_RENDERS = boundary(`  useEffect(() => {
    console.error("Render error", error);
  }, [error]);

  return <ErrorScreen title="Something went wrong" description="Try again." />;`);

ruleTester.run(
  "error-boundary-renders-error-screen",
  errorBoundaryRendersErrorScreenRule,
  {
    valid: [
      {
        name: "a root boundary that logs the error and renders the screen",
        filename: ROOT_BOUNDARY,
        code: LOGS_AND_RENDERS,
      },
      {
        name: "a global boundary that wraps the screen in the document",
        filename: GLOBAL_BOUNDARY,
        code: boundary(`  return (
    <html lang="en">
      <body>
        <ErrorScreen title="Something went wrong" description="Try again." />
      </body>
    </html>
  );`),
      },
      {
        name: "a nested boundary",
        filename: NESTED_BOUNDARY,
        code: LOGS_AND_RENDERS,
      },
      {
        name: "a field of another object named like a leaking one",
        filename: ROOT_BOUNDARY,
        code: boundary(`  const copy = { message: "Try again." };
  return <ErrorScreen title="Error" description={copy.message} />;`),
      },
      {
        name: "a renamed screen component, through the option",
        filename: ROOT_BOUNDARY,
        options: [{ componentName: "FailureScreen" }],
        code: boundary(`  return <FailureScreen />;`),
      },
      {
        name: "a file that is not a boundary, which the rule ignores",
        filename: "/repo/apps/web/src/app/_components/error-card.tsx",
        code: `export function ErrorCard({ error }: { error: Error }) {\n  return <p>{error.message}</p>;\n}\n`,
      },
    ],
    invalid: [
      {
        name: "a boundary that renders its own markup",
        filename: ROOT_BOUNDARY,
        code: boundary(`  return <p>Something went wrong.</p>;`),
        errors: [{ messageId: "missingErrorScreen" }],
      },
      {
        name: "a boundary that shows the error message",
        filename: NESTED_BOUNDARY,
        code: boundary(
          `  return <ErrorScreen title="Error" description={error.message} />;`,
        ),
        errors: [
          {
            messageId: "leakingField",
            data: { object: "error", field: "message" },
          },
        ],
      },
      {
        name: "the digest, the stack, and a computed string access",
        filename: GLOBAL_BOUNDARY,
        code: boundary(`  const id = error.digest;
  const trace = error["stack"];
  return <ErrorScreen title={id} description={trace} />;`),
        errors: [
          {
            messageId: "leakingField",
            data: { object: "error", field: "digest" },
          },
          {
            messageId: "leakingField",
            data: { object: "error", field: "stack" },
          },
        ],
      },
      {
        name: "an optional read of the message",
        filename: ROOT_BOUNDARY,
        code: boundary(
          `  return <ErrorScreen title="Error" description={error?.message} />;`,
        ),
        errors: [{ messageId: "leakingField" }],
      },
      {
        name: "a renamed error prop, through the option",
        filename: ROOT_BOUNDARY,
        options: [{ errorNames: ["err"] }],
        code: `export default function Boundary({ error: err }: { error: Error }) {\n  return <ErrorScreen title="Error" description={err.message} />;\n}\n`,
        errors: [
          {
            messageId: "leakingField",
            data: { object: "err", field: "message" },
          },
        ],
      },
      {
        name: "both checks at once",
        filename: ROOT_BOUNDARY,
        code: boundary(`  return <p>{error.message}</p>;`),
        errors: [
          { messageId: "missingErrorScreen" },
          { messageId: "leakingField" },
        ],
      },
    ],
  },
);
