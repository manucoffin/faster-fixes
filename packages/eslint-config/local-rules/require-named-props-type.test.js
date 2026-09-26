import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { requireNamedPropsTypeRule } from "./require-named-props-type.js";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

const FILENAME = "/repo/apps/web/src/app/_domains/project/_components/card.tsx";

ruleTester.run("require-named-props-type", requireNamedPropsTypeRule, {
  valid: [
    {
      name: "a named props type destructured as the first parameter",
      filename: FILENAME,
      code: `type CardProps = { a: string };\nexport function Card({ a }: CardProps) { return <div>{a}</div>; }\n`,
    },
    {
      name: "a component without props",
      filename: FILENAME,
      code: `export function Card() { return <div />; }\n`,
    },
    {
      name: "a named props type with a default value",
      filename: FILENAME,
      code: `export function Card({ a }: CardProps = { a: "" }) { return <div>{a}</div>; }\n`,
    },
    {
      name: "a camelCase helper with an inline parameter type",
      filename: FILENAME,
      code: `function formatLabel({ a }: { a: string }) { return a; }\n`,
    },
    {
      name: "a route handler taking the request",
      filename: "/repo/apps/web/src/app/api/v1/feedback/route.ts",
      code: `export async function POST(request: NextRequest) { return Response.json(await request.json()); }\n`,
    },
    {
      name: "an unnamed forwardRef callback",
      filename: FILENAME,
      code: `export const Input = forwardRef((props: { a: string }, ref) => <input ref={ref} />);\n`,
    },
    {
      name: "a fallback whose two-argument signature a library imposes",
      filename: FILENAME,
      code: `function Fallback(_props: object, { error }: ErrorInfo) { return <div />; }\n`,
    },
  ],
  invalid: [
    {
      name: "an inline type literal on a function declaration",
      filename: FILENAME,
      code: `export function Card({ a }: { a: string }) { return <div>{a}</div>; }\n`,
      errors: [{ messageId: "inlinePropsType" }],
    },
    {
      name: "a named type intersected with an inline type literal",
      filename: FILENAME,
      code: `export function Card({ a, b }: CardProps & { b: number }) { return <div>{a}</div>; }\n`,
      errors: [{ messageId: "inlinePropsType" }],
    },
    {
      name: "an inline type literal on an arrow component",
      filename: FILENAME,
      code: `const Card = ({ a }: { a: string }) => <div>{a}</div>;\n`,
      errors: [{ messageId: "inlinePropsType" }],
    },
    {
      name: "a bare props parameter",
      filename: FILENAME,
      code: `export function Card(props: CardProps) { return <div>{props.a}</div>; }\n`,
      errors: [{ messageId: "destructureProps" }],
    },
  ],
});
