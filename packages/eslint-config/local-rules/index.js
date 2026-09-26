import { errorBoundaryRendersErrorScreenRule } from "./error-boundary-renders-error-screen.js";
import { kebabCasePathRule } from "./kebab-case-path.js";
import { noClientDomainErrorInstanceofRule } from "./no-client-domain-error-instanceof.js";
import { noClientImportOfServerFolderRule } from "./no-client-import-of-server-folder.js";
import { noClientImportOfServicesRule } from "./no-client-import-of-services.js";
import { noCrossDomainDeepImportRule } from "./no-cross-domain-deep-import.js";
import { noCrossLayerImportRule } from "./no-cross-layer-import.js";
import { noDefaultExportRule } from "./no-default-export.js";
import { noEmDashInCopyRule } from "./no-em-dash-in-copy.js";
import { noFeatureNestingRule } from "./no-feature-nesting.js";
import { noFormMutationInEffectRule } from "./no-form-mutation-in-effect.js";
import { noFormStatePropRule } from "./no-form-state-prop.js";
import { noRawTailwindColorsRule } from "./no-raw-tailwind-colors.js";
import { noRelativeTestMockRule } from "./no-relative-test-mock.js";
import { noRestrictedPatternsRule } from "./no-restricted-patterns.js";
import { requireInngestFunctionPlacementRule } from "./require-inngest-function-placement.js";
import { requireSchemaConventionsRule } from "./require-schema-conventions.js";
import { requireServerActionSuffixRule } from "./require-server-action-suffix.js";
import { requireServiceOutputTypeRule } from "./require-service-output-type.js";
import { requireUseClientSuffixRule } from "./require-use-client-suffix.js";
import { schemaMustBePureZodRule } from "./schema-must-be-pure-zod.js";
import { servicesNoBareErrorRule } from "./services-no-bare-error.js";
import { servicesNoTrpcImportRule } from "./services-no-trpc-import.js";
import { servicesReadNeverWritesRule } from "./services-read-never-writes.js";
import { servicesVerbPrefixRule } from "./services-verb-prefix.js";

export const localRulesPlugin = {
  rules: {
    "error-boundary-renders-error-screen": errorBoundaryRendersErrorScreenRule,
    "kebab-case-path": kebabCasePathRule,
    "no-client-domain-error-instanceof": noClientDomainErrorInstanceofRule,
    "no-client-import-of-server-folder": noClientImportOfServerFolderRule,
    "no-client-import-of-services": noClientImportOfServicesRule,
    "no-cross-domain-deep-import": noCrossDomainDeepImportRule,
    "no-cross-layer-import": noCrossLayerImportRule,
    "no-default-export": noDefaultExportRule,
    "no-em-dash-in-copy": noEmDashInCopyRule,
    "no-feature-nesting": noFeatureNestingRule,
    "no-form-mutation-in-effect": noFormMutationInEffectRule,
    "no-form-state-prop": noFormStatePropRule,
    "no-raw-tailwind-colors": noRawTailwindColorsRule,
    "no-relative-test-mock": noRelativeTestMockRule,
    "no-restricted-patterns": noRestrictedPatternsRule,
    "require-inngest-function-placement": requireInngestFunctionPlacementRule,
    "require-schema-conventions": requireSchemaConventionsRule,
    "require-server-action-suffix": requireServerActionSuffixRule,
    "require-service-output-type": requireServiceOutputTypeRule,
    "require-use-client-suffix": requireUseClientSuffixRule,
    "schema-must-be-pure-zod": schemaMustBePureZodRule,
    "services-no-bare-error": servicesNoBareErrorRule,
    "services-no-trpc-import": servicesNoTrpcImportRule,
    "services-read-never-writes": servicesReadNeverWritesRule,
    "services-verb-prefix": servicesVerbPrefixRule,
  },
};
