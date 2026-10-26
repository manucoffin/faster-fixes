import {
  CUSTOM_METADATA_MAX_KEY_LENGTH,
  CUSTOM_METADATA_MAX_KEYS,
  CUSTOM_METADATA_MAX_VALUE_LENGTH,
} from "./constants.js";
import { isSensitiveParam } from "./diagnostics/redact.js";
import type { CustomMetadata, CustomMetadataValue } from "./types.js";

export type CustomMetadataWarning =
  | { kind: "not-an-object"; message: string }
  | {
      kind:
        | "too-many-keys"
        | "key-truncated"
        | "duplicate-key"
        | "value-truncated"
        | "value-dropped"
        | "sensitive-key";
      key: string;
      message: string;
    };

export type NormalizedCustomMetadata = {
  customMetadata: CustomMetadata;
  warnings: CustomMetadataWarning[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function isPrimitiveValue(value: unknown): value is CustomMetadataValue {
  if (value === null) return true;
  if (typeof value === "number") return Number.isFinite(value);
  return typeof value === "string" || typeof value === "boolean";
}

/**
 * Bring an arbitrary value in line with the Custom metadata limits. The Widget
 * runs it before submitting and the server on ingest, so both agree on what is
 * stored. Never throws: whatever cannot be kept is dropped or truncated and
 * reported as a warning.
 */
export function normalizeCustomMetadata(
  input: unknown,
): NormalizedCustomMetadata {
  const warnings: CustomMetadataWarning[] = [];

  if (!isPlainObject(input)) {
    warnings.push({
      kind: "not-an-object",
      message: "customMetadata must be a plain object; it was ignored.",
    });
    return { customMetadata: {}, warnings };
  }

  // Collected as entries so a `__proto__` key stays an own property instead of
  // reassigning the record's prototype.
  const entries: [string, CustomMetadataValue][] = [];
  const keys = new Set<string>();
  for (const [rawKey, value] of Object.entries(input)) {
    if (!isPrimitiveValue(value)) {
      warnings.push({
        kind: "value-dropped",
        key: rawKey,
        message: `customMetadata "${rawKey}" was dropped: values must be a string, a finite number, a boolean or null.`,
      });
      continue;
    }

    if (entries.length >= CUSTOM_METADATA_MAX_KEYS) {
      warnings.push({
        kind: "too-many-keys",
        key: rawKey,
        message: `customMetadata "${rawKey}" was dropped: at most ${CUSTOM_METADATA_MAX_KEYS} keys are kept.`,
      });
      continue;
    }

    let key = rawKey;
    if (key.length > CUSTOM_METADATA_MAX_KEY_LENGTH) {
      key = key.slice(0, CUSTOM_METADATA_MAX_KEY_LENGTH);
      warnings.push({
        kind: "key-truncated",
        key: rawKey,
        message: `customMetadata key "${rawKey}" was truncated to ${CUSTOM_METADATA_MAX_KEY_LENGTH} characters.`,
      });
    }

    // Two long keys sharing a prefix collapse once truncated; the first wins.
    if (keys.has(key)) {
      warnings.push({
        kind: "duplicate-key",
        key: rawKey,
        message: `customMetadata "${rawKey}" was dropped: its truncated key "${key}" is already used.`,
      });
      continue;
    }

    let kept = value;
    if (
      typeof kept === "string" &&
      kept.length > CUSTOM_METADATA_MAX_VALUE_LENGTH
    ) {
      kept = kept.slice(0, CUSTOM_METADATA_MAX_VALUE_LENGTH);
      warnings.push({
        kind: "value-truncated",
        key: rawKey,
        message: `customMetadata "${rawKey}" value was truncated to ${CUSTOM_METADATA_MAX_VALUE_LENGTH} characters.`,
      });
    }

    // Reported, never redacted: the developer chose the key (ADR-0018).
    if (isSensitiveParam(rawKey)) {
      warnings.push({
        kind: "sensitive-key",
        key: rawKey,
        message: `customMetadata "${rawKey}" looks sensitive; it is sent unredacted and shown to your team and in mirrored Issues.`,
      });
    }

    keys.add(key);
    entries.push([key, kept]);
  }

  return { customMetadata: Object.fromEntries(entries), warnings };
}
