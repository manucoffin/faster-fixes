// react-hook-form's `formState` is a proxy: it subscribes its owner to the
// fields the owner reads during render, and to nothing else. A child handed the
// whole object reads fields its parent never subscribed to, so it renders stale
// values and misses updates without any error to say so.
//
// A field read off the proxy is a plain value and is safe to pass down
// (`isSubmitting={form.formState.isSubmitting}`): the owner read it, so the
// owner is subscribed to it. Only the object itself is reported, as an
// attribute value or as a spread.

const FORM_STATE = "formState";

/** The expression under a type assertion, a non-null assertion or a `?.` chain. */
function unwrap(node) {
  let current = node;
  while (
    current.type === "TSAsExpression" ||
    current.type === "TSSatisfiesExpression" ||
    current.type === "TSNonNullExpression" ||
    current.type === "ChainExpression"
  ) {
    current = current.expression;
  }
  return current;
}

function isFormStateObject(node) {
  const expression = unwrap(node);

  if (expression.type === "Identifier") return expression.name === FORM_STATE;
  if (expression.type !== "MemberExpression") return false;

  const { property, computed } = expression;
  if (!computed) {
    return property.type === "Identifier" && property.name === FORM_STATE;
  }
  return property.type === "Literal" && property.value === FORM_STATE;
}

export const noFormStatePropRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A component does not receive the whole react-hook-form `formState` object as a prop.",
    },
    schema: [],
    messages: {
      formStateProp:
        "`formState` is a proxy that only tracks the fields its owner reads, so a child handed the whole object misses updates. Have the child read the state with `useFormContext()` or `useFormState()`, or pass it the single field it needs (`isSubmitting={form.formState.isSubmitting}`).",
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        const value = node.value;
        if (!value || value.type !== "JSXExpressionContainer") return;
        if (value.expression.type === "JSXEmptyExpression") return;
        if (!isFormStateObject(value.expression)) return;

        context.report({ node, messageId: "formStateProp" });
      },
      JSXSpreadAttribute(node) {
        if (!isFormStateObject(node.argument)) return;
        context.report({ node, messageId: "formStateProp" });
      },
    };
  },
};
