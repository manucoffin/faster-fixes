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

/** Every option except `projectId`, which only the HTTP client needs. */
export type DisplayOptions = Omit<WidgetOptions, "projectId">;

export type ResolvedDisplayOptions = Omit<ResolvedWidgetOptions, "projectId">;

export type DisplayOptionsValidationResult =
  | { valid: true; options: ResolvedDisplayOptions }
  | { valid: false; option: keyof DisplayOptions; message: string };

function isPosition(value: unknown): value is WidgetPosition {
  return WIDGET_POSITIONS.some((position) => position === value);
}

function checkProjectId(input: Record<string, unknown>) {
  const { projectId } = input;
  if (typeof projectId !== "string" || projectId.trim() === "") {
    return {
      option: "projectId",
      message: "`projectId` must be a non-empty string.",
    } as const;
  }
  return undefined;
}

function checkDisplayOptions(input: Record<string, unknown>) {
  const { position, labels } = input;
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

function toFields(input: unknown) {
  return typeof input === "object" && input !== null
    ? (input as Record<string, unknown>)
    : {};
}

function reportFailure(failure: { message: string }) {
  if (isDevelopment()) {
    console.error(`[faster-fixes] Invalid option ${failure.message}`);
  }
}

function resolveDisplayOptions(
  options: DisplayOptions,
): ResolvedDisplayOptions {
  return {
    apiOrigin: options.apiOrigin ?? DEFAULT_API_ORIGIN,
    color: options.color ?? DEFAULT_WIDGET_COLOR,
    position: options.position ?? DEFAULT_WIDGET_POSITION,
    labels: resolveLabels(options.labels),
    captureDiagnostics: options.captureDiagnostics ?? true,
  };
}

// Options can come from untyped script-tag code, so the input is `unknown`.
export function validateOptions(input: unknown): OptionsValidationResult {
  const fields = toFields(input);
  const failure = checkProjectId(fields) ?? checkDisplayOptions(fields);
  if (failure) {
    reportFailure(failure);
    return { valid: false, ...failure };
  }

  const options = fields as WidgetOptions;
  return {
    valid: true,
    options: {
      projectId: options.projectId,
      ...resolveDisplayOptions(options),
    },
  };
}

// For a Widget running against an injected client, where no `projectId` exists.
export function validateDisplayOptions(
  input: unknown,
): DisplayOptionsValidationResult {
  const fields = toFields(input);
  const failure = checkDisplayOptions(fields);
  if (failure) {
    reportFailure(failure);
    return { valid: false, ...failure };
  }
  return { valid: true, options: resolveDisplayOptions(fields) };
}
