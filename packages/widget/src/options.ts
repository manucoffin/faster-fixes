import {
  DEFAULT_API_ORIGIN,
  DEFAULT_WIDGET_COLOR,
  DEFAULT_WIDGET_POSITION,
  WIDGET_POSITIONS,
} from "@fasterfixes/core";
import type { Labels, WidgetPosition } from "@fasterfixes/core";

import { isDevelopment } from "./environment.js";
import { resolveLabels } from "./labels.js";

export type WidgetOptions = {
  /** The Project public ID, `proj_...`. */
  projectId: string;
  apiOrigin?: string;
  color?: string;
  position?: WidgetPosition;
  labels?: Partial<Labels>;
  /** Records the Diagnostic Trail from mount. Defaults to `true`. */
  captureDiagnostics?: boolean;
};

export type ResolvedWidgetOptions = Required<Omit<WidgetOptions, "labels">> & {
  labels: Labels;
};

export type OptionsValidationResult =
  | { valid: true; options: ResolvedWidgetOptions }
  | { valid: false; option: keyof WidgetOptions; message: string };

function isPosition(value: unknown): value is WidgetPosition {
  return WIDGET_POSITIONS.some((position) => position === value);
}

function checkOptions(input: Record<string, unknown>) {
  const { projectId, position, labels } = input;
  if (typeof projectId !== "string" || projectId.trim() === "") {
    return {
      option: "projectId",
      message: "`projectId` must be a non-empty string.",
    } as const;
  }
  if (position !== undefined && !isPosition(position)) {
    return {
      option: "position",
      message: `\`position\` must be one of ${WIDGET_POSITIONS.join(", ")}. Received ${JSON.stringify(position)}.`,
    } as const;
  }
  if (
    labels !== undefined &&
    (typeof labels !== "object" || labels === null || Array.isArray(labels))
  ) {
    return {
      option: "labels",
      message: "`labels` must be an object.",
    } as const;
  }
  return undefined;
}

// Options can come from untyped script-tag code, so the input is `unknown`.
export function validateOptions(input: unknown): OptionsValidationResult {
  const fields =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};
  const failure = checkOptions(fields);
  if (failure) {
    if (isDevelopment()) {
      console.error(`[faster-fixes] Invalid option ${failure.message}`);
    }
    return { valid: false, ...failure };
  }

  const options = fields as WidgetOptions;
  return {
    valid: true,
    options: {
      projectId: options.projectId,
      apiOrigin: options.apiOrigin ?? DEFAULT_API_ORIGIN,
      color: options.color ?? DEFAULT_WIDGET_COLOR,
      position: options.position ?? DEFAULT_WIDGET_POSITION,
      labels: resolveLabels(options.labels),
      captureDiagnostics: options.captureDiagnostics ?? true,
    },
  };
}
