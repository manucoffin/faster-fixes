import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noFormStatePropRule } from "./no-form-state-prop.js";

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

const FEATURE =
  "/repo/apps/web/src/app/_domains/project/_features/create-project-form.client.tsx";

const render = (jsx) => `export function CreateProjectForm() {
  const form = useForm();
  const { formState } = form;
  return ${jsx};
}
`;

ruleTester.run("no-form-state-prop", noFormStatePropRule, {
  valid: [
    {
      name: "a single field read off the proxy",
      filename: FEATURE,
      code: render(
        `<SubmitButton isSubmitting={form.formState.isSubmitting} />`,
      ),
    },
    {
      name: "a single field read off the destructured proxy",
      filename: FEATURE,
      code: render(`<SubmitButton disabled={!formState.isValid} />`),
    },
    {
      name: "a nested field read off the proxy",
      filename: FEATURE,
      code: render(`<FieldError error={form.formState.errors.name} />`),
    },
    {
      name: "a string attribute that happens to say formState",
      filename: FEATURE,
      code: render(`<Debug label="formState" />`),
    },
    {
      name: "the form handle itself, which the child reads through its own hooks",
      filename: FEATURE,
      code: render(`<Form {...form} />`),
    },
  ],
  invalid: [
    {
      name: "the proxy read off the form handle",
      filename: FEATURE,
      code: render(`<SubmitButton formState={form.formState} />`),
      errors: [{ messageId: "formStateProp" }],
    },
    {
      name: "the destructured proxy under another prop name",
      filename: FEATURE,
      code: render(`<SubmitButton state={formState} />`),
      errors: [{ messageId: "formStateProp" }],
    },
    {
      name: "the proxy behind a type assertion",
      filename: FEATURE,
      code: render(
        `<SubmitButton state={form.formState as FormState<Values>} />`,
      ),
      errors: [{ messageId: "formStateProp" }],
    },
    {
      name: "the proxy through optional chaining",
      filename: FEATURE,
      code: render(`<SubmitButton state={form?.formState} />`),
      errors: [{ messageId: "formStateProp" }],
    },
    {
      name: "the proxy through a computed string access",
      filename: FEATURE,
      code: render(`<SubmitButton state={form["formState"]} />`),
      errors: [{ messageId: "formStateProp" }],
    },
    {
      name: "the proxy spread onto a child",
      filename: FEATURE,
      code: render(`<SubmitButton {...form.formState} />`),
      errors: [{ messageId: "formStateProp" }],
    },
    {
      name: "the destructured proxy spread onto a child",
      filename: FEATURE,
      code: render(`<SubmitButton {...formState} />`),
      errors: [{ messageId: "formStateProp" }],
    },
  ],
});
