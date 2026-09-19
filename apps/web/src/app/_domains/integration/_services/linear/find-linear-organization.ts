import { getLinearClient } from "./linear-client";

/** The Linear organization an access token was granted for. */
export type LinearOrganizationSummary = {
  id: string;
  name: string;
  urlKey: string;
};

/**
 * The Linear organization behind an access token, or `null` when Linear does
 * not answer for it. A revoked token and an unreachable Linear collapse into
 * the same `null`, because the only thing the caller can do with either is send
 * the User back through the consent screen.
 */
export async function findLinearOrganization(accessToken: string) {
  try {
    const organization = await getLinearClient(accessToken).organization;

    return {
      id: organization.id,
      name: organization.name,
      urlKey: organization.urlKey,
    } satisfies LinearOrganizationSummary;
  } catch {
    return null;
  }
}

export type FindLinearOrganizationOutput = Awaited<
  ReturnType<typeof findLinearOrganization>
>;
