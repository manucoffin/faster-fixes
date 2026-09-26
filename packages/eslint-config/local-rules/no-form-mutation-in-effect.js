// A react-hook-form `reset` or `setValue` inside an effect copies a source into
// the form after the render that saw the source change. It runs again on every
// change of a dependency, so it overwrites whatever the user typed since, and
// it renders the form twice for one update. `useForm({ values })` makes the
// form follow its source without either problem, and a change the user causes
// belongs in the event handler that causes it.
//
// The rule recognises a form handle in two ways. A binding resolved through
// scope to a `useForm()` or `useFormContext()` call is one, whatever its name.
// A binding it cannot trace (a prop, a parameter) is one when its name reads
// like a form (`form`, `projectForm`), so `mutation.reset()` and
// `query.reset()` stay out of reach. A bare `reset()` or `setValue()` counts
// only when it was destructured from one of those two hooks, renamed or not.
//
// A genuine one-off is a disable comment with its reason, read in the diff.

const EFFECT_HOOKS = new Set(["useEffect", "useLayoutEffect"]);
const FORM_HOOKS = new Set(["useForm", "useFormContext"]);
const MUTATING_METHODS = new Set(["reset", "setValue"]);
const DEFAULT_FORM_NAME_PATTERN = "^(form|\\w+Form)$";

function calleeNameOf(call) {
  const callee = call.callee;
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

function isFunction(node) {
  return (
    node.type === "ArrowFunctionExpression" ||
    node.type === "FunctionExpression"
  );
}

/** True when the function is the callback of a `useEffect`-like call. */
function isEffectCallback(fn) {
  const parent = fn.parent;
  return (
    parent?.type === "CallExpression" &&
    parent.arguments[0] === fn &&
    EFFECT_HOOKS.has(calleeNameOf(parent))
  );
}

function isFormHookCall(node) {
  return node?.type === "CallExpression" && FORM_HOOKS.has(calleeNameOf(node));
}

function resolveVariable(context, identifier) {
  let scope = context.sourceCode.getScope(identifier);
  while (scope) {
    const variable = scope.set.get(identifier.name);
    if (variable) return variable;
    scope = scope.upper;
  }
  return null;
}

function declaratorOf(variable) {
  const def = variable?.defs[0];
  if (def?.type !== "Variable") return null;
  return def.node;
}

/** The pattern key the identifier was destructured under, `reset` for `{ reset: resetForm }`. */
function destructuredKeyOf(pattern, identifier) {
  for (const property of pattern.properties) {
    if (property.type !== "Property" || property.computed) continue;
    const value =
      property.value.type === "AssignmentPattern"
        ? property.value.left
        : property.value;
    if (value !== identifier) continue;
    if (property.key.type === "Identifier") return property.key.name;
    if (property.key.type === "Literal") return String(property.key.value);
  }
  return null;
}

export const noFormMutationInEffectRule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "A react-hook-form `reset` or `setValue` is not called inside a `useEffect` or `useLayoutEffect` callback.",
    },
    schema: [
      {
        type: "object",
        properties: {
          formNamePattern: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      mutationInEffect:
        "`{{ method }}` inside an effect overwrites the user's input each time a dependency changes, and renders the form twice. Pass `values` to `useForm` so the form follows its source, or call `{{ method }}` from the event handler that causes the change. A genuine one-off is a disable comment with its reason.",
    },
  },
  create(context) {
    const [{ formNamePattern = DEFAULT_FORM_NAME_PATTERN } = {}] =
      context.options;
    const formNameRe = new RegExp(formNamePattern);

    function isInsideEffect(node) {
      return context.sourceCode
        .getAncestors(node)
        .some((ancestor) => isFunction(ancestor) && isEffectCallback(ancestor));
    }

    function isFormHandle(identifier) {
      const declarator = declaratorOf(resolveVariable(context, identifier));
      if (
        declarator?.id.type === "Identifier" &&
        isFormHookCall(declarator.init)
      ) {
        return true;
      }
      return formNameRe.test(identifier.name);
    }

    /** The method name a bare call stands for, when it came out of a form hook. */
    function destructuredMethodOf(identifier) {
      const variable = resolveVariable(context, identifier);
      const declarator = declaratorOf(variable);
      if (declarator?.id.type !== "ObjectPattern") return null;
      if (!isFormHookCall(declarator.init)) return null;

      const key = destructuredKeyOf(declarator.id, variable.defs[0].name);
      return MUTATING_METHODS.has(key) ? key : null;
    }

    function mutatingMethodOf(callee) {
      if (callee.type === "Identifier") return destructuredMethodOf(callee);

      if (callee.type !== "MemberExpression" || callee.computed) return null;
      if (callee.property.type !== "Identifier") return null;
      if (!MUTATING_METHODS.has(callee.property.name)) return null;
      if (callee.object.type !== "Identifier") return null;
      return isFormHandle(callee.object) ? callee.property.name : null;
    }

    return {
      CallExpression(node) {
        const method = mutatingMethodOf(node.callee);
        if (!method) return;
        if (!isInsideEffect(node)) return;

        context.report({
          node,
          messageId: "mutationInEffect",
          data: { method },
        });
      },
    };
  },
};
