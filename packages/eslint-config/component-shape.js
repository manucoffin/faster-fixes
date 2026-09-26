import { localRulesPlugin } from "./local-rules/index.js";

/**
 * The component shape shared by every workspace that defines React
 * components: one style of component across the repo.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const componentShapeConfig = [
  {
    files: ["**/src/**/*.{ts,tsx}"],
    plugins: {
      local: localRulesPlugin,
    },
    rules: {
      // A named component is an `export function`, which hoists and shows its
      // name in a stack. An unnamed one is still an arrow, because that is the
      // only thing an inline render prop can be.
      "react/function-component-definition": [
        "error",
        {
          namedComponents: "function-declaration",
          unnamedComponents: "arrow-function",
        },
      ],
      // Props live in a named type and are destructured in the signature: the
      // type is the contract a caller reads, the destructuring shows what the
      // body uses.
      "local/require-named-props-type": "error",
    },
  },
];
