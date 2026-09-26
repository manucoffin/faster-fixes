/**
 * The component shape shared by every workspace that defines React
 * components: one style of component across the repo.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const componentShapeConfig = [
  {
    files: ["**/src/**/*.{ts,tsx}"],
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
    },
  },
];
