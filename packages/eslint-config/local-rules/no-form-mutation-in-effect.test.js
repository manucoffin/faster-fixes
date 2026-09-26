import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import { describe, it } from "vitest";

import { noFormMutationInEffectRule } from "./no-form-mutation-in-effect.js";

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
  "/repo/apps/web/src/app/_domains/project/_features/edit-project-form.client.tsx";

const component = (body) => `import { useEffect, useLayoutEffect } from "react";
import * as React from "react";
import { useForm, useFormContext } from "react-hook-form";

export function EditProjectForm({ project }: { project: Project }) {
${body}
}
`;

ruleTester.run("no-form-mutation-in-effect", noFormMutationInEffectRule, {
  valid: [
    {
      name: "the form following its source through `values`",
      filename: FEATURE,
      code: component(`  const form = useForm({ values: project });
  return null;`),
    },
    {
      name: "a reset from the event handler that causes the change",
      filename: FEATURE,
      code: component(`  const form = useForm();
  const onCancel = () => form.reset(project);
  return <button onClick={onCancel}>Cancel</button>;`),
    },
    {
      name: "a mutation reset inside an effect",
      filename: FEATURE,
      code: component(`  const mutation = useMutation();
  useEffect(() => {
    mutation.reset();
  }, [project]);
  return null;`),
    },
    {
      name: "a query reset inside an effect",
      filename: FEATURE,
      code: component(`  const query = useQuery();
  useEffect(() => {
    query.reset();
  }, [project]);
  return null;`),
    },
    {
      name: "a bare reset that did not come from a form hook",
      filename: FEATURE,
      code: component(`  const { reset } = useMutation();
  useEffect(() => {
    reset();
  }, [project]);
  return null;`),
    },
    {
      name: "a form hook value other than reset and setValue",
      filename: FEATURE,
      code: component(`  const { trigger } = useForm();
  useEffect(() => {
    trigger("name");
  }, [project]);
  return null;`),
    },
    {
      name: "a form reset in the dependency list, not in the callback",
      filename: FEATURE,
      code: component(`  const form = useForm();
  useEffect(() => {}, [form.reset]);
  return null;`),
    },
    {
      name: "a form reset in a callback that is not the first effect argument",
      filename: FEATURE,
      code: component(`  const form = useForm();
  useMemo(() => form.reset(project), [project]);
  return null;`),
    },
  ],
  invalid: [
    {
      name: "a reset of a `useForm` handle in `useEffect`",
      filename: FEATURE,
      code: component(`  const form = useForm();
  useEffect(() => {
    form.reset(project);
  }, [project]);
  return null;`),
      errors: [{ messageId: "mutationInEffect", data: { method: "reset" } }],
    },
    {
      name: "a setValue of a `useFormContext` handle with any name",
      filename: FEATURE,
      code: component(`  const methods = useFormContext();
  useEffect(() => {
    methods.setValue("name", project.name);
  }, [project]);
  return null;`),
      errors: [{ messageId: "mutationInEffect", data: { method: "setValue" } }],
    },
    {
      name: "a handle received as a prop, recognised by its name",
      filename: FEATURE,
      code: `import { useEffect } from "react";\n\nexport function Fields({ projectForm }: Props) {\n  useEffect(() => {\n    projectForm.reset();\n  }, []);\n  return null;\n}\n`,
      errors: [{ messageId: "mutationInEffect", data: { method: "reset" } }],
    },
    {
      name: "a bare reset destructured from `useForm`",
      filename: FEATURE,
      code: component(`  const { reset } = useForm();
  useEffect(() => {
    reset(project);
  }, [project, reset]);
  return null;`),
      errors: [{ messageId: "mutationInEffect", data: { method: "reset" } }],
    },
    {
      name: "a renamed setValue destructured from `useFormContext`",
      filename: FEATURE,
      code: component(`  const { setValue: setField } = useFormContext();
  useEffect(() => {
    setField("name", project.name);
  }, [project, setField]);
  return null;`),
      errors: [{ messageId: "mutationInEffect", data: { method: "setValue" } }],
    },
    {
      name: "a reset in `useLayoutEffect`",
      filename: FEATURE,
      code: component(`  const form = useForm();
  useLayoutEffect(() => {
    form.reset(project);
  }, [project]);
  return null;`),
      errors: [{ messageId: "mutationInEffect" }],
    },
    {
      name: "a reset in `React.useEffect`",
      filename: FEATURE,
      code: component(`  const form = useForm();
  React.useEffect(() => {
    form.reset(project);
  }, [project]);
  return null;`),
      errors: [{ messageId: "mutationInEffect" }],
    },
    {
      name: "a reset in a function nested inside the effect callback",
      filename: FEATURE,
      code: component(`  const form = useForm();
  useEffect(() => {
    const timer = setTimeout(function () {
      form.reset(project);
    }, 100);
    return () => clearTimeout(timer);
  }, [project]);
  return null;`),
      errors: [{ messageId: "mutationInEffect" }],
    },
    {
      name: "a custom form name pattern, through the option",
      filename: FEATURE,
      options: [{ formNamePattern: "^methods$" }],
      code: `import { useEffect } from "react";\n\nexport function Fields({ methods }: Props) {\n  useEffect(() => {\n    methods.setValue("name", "");\n  }, []);\n  return null;\n}\n`,
      errors: [{ messageId: "mutationInEffect" }],
    },
  ],
});
