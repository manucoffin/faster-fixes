import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

import { config as baseConfig } from "./base.js";
import { componentShapeConfig } from "./component-shape.js";
import { withBinarySeverity } from "./severity.js";

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").Linter.Config[]} */
export const config = withBinarySeverity([
  ...baseConfig,
  pluginReact.configs.flat.recommended,
  {
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    settings: { react: { version: "detect" } },
    rules: {
      // v7 preset: the React Compiler rules (`set-state-in-effect`, `refs`,
      // `purity`, `immutability`, `static-components`, ...) report the
      // patterns the compiler cannot optimise and that usually hide a bug.
      ...pluginReactHooks.configs["recommended-latest"].rules,
      // React scope no longer necessary with new JSX transform.
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
    },
  },
  ...componentShapeConfig,
]);
