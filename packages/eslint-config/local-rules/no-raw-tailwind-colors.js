const RAW_TAILWIND_COLOR_RE =
  /^(?:text|bg|border|ring|stroke|fill|from|via|to|decoration|outline|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}(?:\/\d{1,3})?$/;

function getClassTokens(value) {
  return value
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function stripVariantPrefix(token) {
  const cleaned = token.startsWith("!") ? token.slice(1) : token;
  const parts = cleaned.split(":");
  return parts[parts.length - 1];
}

function isRawColorClass(token, allowPatterns) {
  if (allowPatterns.some((pattern) => new RegExp(pattern).test(token))) {
    return false;
  }

  const baseToken = stripVariantPrefix(token);
  if (allowPatterns.some((pattern) => new RegExp(pattern).test(baseToken))) {
    return false;
  }

  return RAW_TAILWIND_COLOR_RE.test(baseToken);
}

function collectLiteralClassValues(node, out) {
  if (!node) return;

  if (node.type === "Literal" && typeof node.value === "string") {
    out.push({ value: node.value, node });
    return;
  }

  if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis) {
      if (quasi.value?.cooked) {
        out.push({ value: quasi.value.cooked, node: quasi });
      }
    }
    return;
  }

  if (node.type === "ArrayExpression") {
    for (const element of node.elements) {
      collectLiteralClassValues(element, out);
    }
    return;
  }

  if (node.type === "ObjectExpression") {
    for (const property of node.properties) {
      if (
        property.type === "Property" &&
        property.key &&
        property.key.type === "Literal" &&
        typeof property.key.value === "string"
      ) {
        out.push({ value: property.key.value, node: property.key });
      }
    }
    return;
  }

  if (node.type === "ConditionalExpression") {
    collectLiteralClassValues(node.consequent, out);
    collectLiteralClassValues(node.alternate, out);
    return;
  }

  if (node.type === "LogicalExpression") {
    collectLiteralClassValues(node.left, out);
    collectLiteralClassValues(node.right, out);
  }
}

function isClassNameAttribute(node) {
  if (node.type !== "JSXAttribute" || !node.name) return false;
  return node.name.name === "className" || node.name.name === "class";
}

function isClassHelperCall(node) {
  if (node.type !== "CallExpression" || node.callee.type !== "Identifier") {
    return false;
  }

  return ["cn", "clsx", "cva", "twMerge"].includes(node.callee.name);
}

export const noRawTailwindColorsRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow raw Tailwind palette classes and prefer semantic design token classes",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowPatterns: {
            type: "array",
            items: { type: "string" },
          },
          ignorePathPatterns: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      avoidRawColor:
        "Avoid raw Tailwind color class `{{className}}`. Prefer semantic token classes (e.g. text-muted-foreground, bg-destructive).",
    },
  },
  create(context) {
    const [{ allowPatterns = [], ignorePathPatterns = [] } = {}] = context.options;
    const filename = context.filename;

    if (ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))) {
      return {};
    }

    function reportRawClasses(value, node) {
      for (const token of getClassTokens(value)) {
        if (isRawColorClass(token, allowPatterns)) {
          context.report({
            node,
            messageId: "avoidRawColor",
            data: { className: token },
          });
        }
      }
    }

    return {
      JSXAttribute(node) {
        if (!isClassNameAttribute(node) || !node.value) {
          return;
        }

        if (node.value.type === "Literal" && typeof node.value.value === "string") {
          reportRawClasses(node.value.value, node.value);
          return;
        }

        if (node.value.type === "JSXExpressionContainer") {
          const literals = [];
          collectLiteralClassValues(node.value.expression, literals);
          for (const literal of literals) {
            reportRawClasses(literal.value, literal.node);
          }
        }
      },
      CallExpression(node) {
        if (!isClassHelperCall(node)) {
          return;
        }

        const literals = [];
        for (const arg of node.arguments) {
          collectLiteralClassValues(arg, literals);
        }

        for (const literal of literals) {
          reportRawClasses(literal.value, literal.node);
        }
      },
    };
  },
};
