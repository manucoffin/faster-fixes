import { noClientImportOfServerErrorsRule } from "./no-client-import-of-server-errors.js";
import { noClientImportOfServicesRule } from "./no-client-import-of-services.js";
import { noCrossDomainDeepImportRule } from "./no-cross-domain-deep-import.js";
import { noDeprecatedErrorImportsRule } from "./no-deprecated-error-imports.js";
import { noDefaultExportRule } from "./no-default-export.js";
import { noFeatureNestingRule } from "./no-feature-nesting.js";
import { noRawTailwindColorsRule } from "./no-raw-tailwind-colors.js";
import { requireSchemaConventionsRule } from "./require-schema-conventions.js";
import { requireServerActionSuffixRule } from "./require-server-action-suffix.js";
import { requireTrpcOutputTypeRule } from "./require-trpc-output-type.js";
import { requireUseClientSuffixRule } from "./require-use-client-suffix.js";
import { schemaMustBePureZodRule } from "./schema-must-be-pure-zod.js";
import { servicesNoBareErrorRule } from "./services-no-bare-error.js";
import { servicesNoTrpcImportRule } from "./services-no-trpc-import.js";
import { servicesVerbPrefixRule } from "./services-verb-prefix.js";

export const localRulesPlugin = {
  rules: {
    "no-client-import-of-server-errors": noClientImportOfServerErrorsRule,
    "no-client-import-of-services": noClientImportOfServicesRule,
    "no-cross-domain-deep-import": noCrossDomainDeepImportRule,
    "no-deprecated-error-imports": noDeprecatedErrorImportsRule,
    "no-default-export": noDefaultExportRule,
    "no-feature-nesting": noFeatureNestingRule,
    "no-raw-tailwind-colors": noRawTailwindColorsRule,
    "require-schema-conventions": requireSchemaConventionsRule,
    "require-server-action-suffix": requireServerActionSuffixRule,
    "require-trpc-output-type": requireTrpcOutputTypeRule,
    "require-use-client-suffix": requireUseClientSuffixRule,
    "schema-must-be-pure-zod": schemaMustBePureZodRule,
    "services-no-bare-error": servicesNoBareErrorRule,
    "services-no-trpc-import": servicesNoTrpcImportRule,
    "services-verb-prefix": servicesVerbPrefixRule,
  },
};
