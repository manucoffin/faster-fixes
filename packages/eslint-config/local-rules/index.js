import { noClientDomainErrorInstanceofRule } from "./no-client-domain-error-instanceof.js";
import { noClientImportOfServerFolderRule } from "./no-client-import-of-server-folder.js";
import { noClientImportOfServicesRule } from "./no-client-import-of-services.js";
import { noCrossDomainDeepImportRule } from "./no-cross-domain-deep-import.js";
import { noCrossLayerImportRule } from "./no-cross-layer-import.js";
import { noDefaultExportRule } from "./no-default-export.js";
import { noFeatureNestingRule } from "./no-feature-nesting.js";
import { noRawTailwindColorsRule } from "./no-raw-tailwind-colors.js";
import { noRelativeTestMockRule } from "./no-relative-test-mock.js";
import { requireInngestFunctionPlacementRule } from "./require-inngest-function-placement.js";
import { requireSchemaConventionsRule } from "./require-schema-conventions.js";
import { requireServerActionSuffixRule } from "./require-server-action-suffix.js";
import { requireServiceOutputTypeRule } from "./require-service-output-type.js";
import { requireUseClientSuffixRule } from "./require-use-client-suffix.js";
import { schemaMustBePureZodRule } from "./schema-must-be-pure-zod.js";
import { servicesNoBareErrorRule } from "./services-no-bare-error.js";
import { servicesNoTrpcImportRule } from "./services-no-trpc-import.js";
import { servicesVerbPrefixRule } from "./services-verb-prefix.js";

export const localRulesPlugin = {
  rules: {
    "no-client-domain-error-instanceof": noClientDomainErrorInstanceofRule,
    "no-client-import-of-server-folder": noClientImportOfServerFolderRule,
    "no-client-import-of-services": noClientImportOfServicesRule,
    "no-cross-domain-deep-import": noCrossDomainDeepImportRule,
    "no-cross-layer-import": noCrossLayerImportRule,
    "no-default-export": noDefaultExportRule,
    "no-feature-nesting": noFeatureNestingRule,
    "no-raw-tailwind-colors": noRawTailwindColorsRule,
    "no-relative-test-mock": noRelativeTestMockRule,
    "require-inngest-function-placement": requireInngestFunctionPlacementRule,
    "require-schema-conventions": requireSchemaConventionsRule,
    "require-server-action-suffix": requireServerActionSuffixRule,
    "require-service-output-type": requireServiceOutputTypeRule,
    "require-use-client-suffix": requireUseClientSuffixRule,
    "schema-must-be-pure-zod": schemaMustBePureZodRule,
    "services-no-bare-error": servicesNoBareErrorRule,
    "services-no-trpc-import": servicesNoTrpcImportRule,
    "services-verb-prefix": servicesVerbPrefixRule,
  },
};
