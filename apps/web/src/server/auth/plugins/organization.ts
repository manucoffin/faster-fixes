import { organization } from "better-auth/plugins";

export const organizationPlugin = organization({
  schema: {
    organization: {
      additionalFields: {
        isDefault: {
          type: "boolean",
          required: true,
          defaultValue: false,
        },
      },
    },
  },
});
