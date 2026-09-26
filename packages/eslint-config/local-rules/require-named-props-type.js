// A named props type is what a caller reads to learn a component's contract
// and what a wrapper reuses (`ComponentProps<typeof X>` hides nothing, an
// inline literal can only be copied). Destructuring in the parameter list
// shows which props the body actually reads.
// A component is a PascalCase function: a declaration, or an arrow / function
// expression assigned to a PascalCase const. Wrapped callbacks (`forwardRef`,
// `memo`) are unnamed and not checked. A component takes one argument: a
// second one means the signature is imposed by a library, not chosen.

// At least one lowercase letter: an all-caps name is a route handler (`GET`,
// `POST`) taking a `Request`, not a component taking props.
const COMPONENT_NAME = /^[A-Z](?=[A-Za-z0-9]*[a-z])[A-Za-z0-9]*$/;

function componentName(node) {
  if (node.type === "FunctionDeclaration") return node.id?.name ?? null;
  const { parent } = node;
  if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier")
    return parent.id.name;
  return null;
}

function hasInlineTypeLiteral(typeNode) {
  if (typeNode.type === "TSTypeLiteral") return true;
  if (typeNode.type === "TSIntersectionType")
    return typeNode.types.some(hasInlineTypeLiteral);
  return false;
}

export const requireNamedPropsTypeRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "A component's props are a separate named type, destructured as the first parameter, so the contract is readable and reusable and the props the body reads are visible.",
    },
    schema: [],
    messages: {
      inlinePropsType:
        "Component `{{name}}` types its props inline: declare `type {{name}}Props = { ... }` and annotate the parameter with it.",
      destructureProps:
        "Component `{{name}}` takes its props as `{{param}}`: destructure them in the parameter list (`{ a, b }: {{name}}Props`).",
    },
  },
  create(context) {
    function check(node) {
      const name = componentName(node);
      if (!name || !COMPONENT_NAME.test(name)) return;
      if (node.params.length !== 1) return;
      const [param] = node.params;
      const pattern = param.type === "AssignmentPattern" ? param.left : param;
      const annotation = pattern.typeAnnotation?.typeAnnotation;
      if (annotation && hasInlineTypeLiteral(annotation)) {
        context.report({
          node: param,
          messageId: "inlinePropsType",
          data: { name },
        });
        return;
      }
      if (pattern.type === "Identifier" && annotation) {
        context.report({
          node: param,
          messageId: "destructureProps",
          data: { name, param: pattern.name },
        });
      }
    }

    return {
      FunctionDeclaration: check,
      "VariableDeclarator > ArrowFunctionExpression.init": check,
      "VariableDeclarator > FunctionExpression.init": check,
    };
  },
};
