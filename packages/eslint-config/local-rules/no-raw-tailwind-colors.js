const COLOR_UTILITIES = [
  "text",
  "bg",
  "border",
  "ring",
  "stroke",
  "fill",
  "from",
  "via",
  "to",
  "decoration",
  "outline",
  "shadow",
];

const PALETTE_HUES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

const RAW_TAILWIND_COLOR_RE = new RegExp(
  `^(${COLOR_UTILITIES.join("|")})-(${PALETTE_HUES.join("|")})-\\d{2,3}(?:\\/\\d{1,3})?$`,
);

const NEUTRAL_TOKENS = ["muted", "border", "foreground"];

/**
 * The hues the theme has a semantic token for. A hue absent from this table is
 * not reported, so the rule never asks for a token that does not exist: adding
 * `warning` and `info` to the theme is what unlocks yellow, amber and blue.
 */
const HUE_TOKENS = {
  red: "destructive",
  green: "success",
  emerald: "success",
  slate: NEUTRAL_TOKENS,
  gray: NEUTRAL_TOKENS,
  zinc: NEUTRAL_TOKENS,
  neutral: NEUTRAL_TOKENS,
  stone: NEUTRAL_TOKENS,
};

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

/**
 * Returns the utility and the hue of a raw palette class, or `null` when the
 * token is not one or is explicitly allowed.
 */
function matchRawColorClass(token, allowPatterns) {
  if (allowPatterns.some((pattern) => new RegExp(pattern).test(token))) {
    return null;
  }

  const baseToken = stripVariantPrefix(token);
  if (allowPatterns.some((pattern) => new RegExp(pattern).test(baseToken))) {
    return null;
  }

  const match = RAW_TAILWIND_COLOR_RE.exec(baseToken);
  return match ? { utility: match[1], hue: match[2] } : null;
}

/** Names the replacement so the message says what to write instead. */
function describeTokens(utility, tokens) {
  const names = Array.isArray(tokens) ? tokens : [tokens];

  if (names.length === 1) {
    return `\`${utility}-${names[0]}\``;
  }

  const quoted = names.map((name) => `\`${name}\``);
  return `one of the ${quoted.slice(0, -1).join(", ")} or ${quoted[quoted.length - 1]} token classes`;
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
        "Avoid raw Tailwind color class `{{className}}`. Use {{suggestion}} instead.",
    },
  },
  create(context) {
    const [{ allowPatterns = [], ignorePathPatterns = [] } = {}] =
      context.options;
    const filename = context.filename;

    if (
      ignorePathPatterns.some((pattern) => new RegExp(pattern).test(filename))
    ) {
      return {};
    }

    function reportRawClasses(value, node) {
      for (const token of getClassTokens(value)) {
        const rawColor = matchRawColorClass(token, allowPatterns);
        const tokens = rawColor && HUE_TOKENS[rawColor.hue];
        if (!tokens) {
          continue;
        }

        context.report({
          node,
          messageId: "avoidRawColor",
          data: {
            className: token,
            suggestion: describeTokens(rawColor.utility, tokens),
          },
        });
      }
    }

    return {
      JSXAttribute(node) {
        if (!isClassNameAttribute(node) || !node.value) {
          return;
        }

        if (
          node.value.type === "Literal" &&
          typeof node.value.value === "string"
        ) {
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
