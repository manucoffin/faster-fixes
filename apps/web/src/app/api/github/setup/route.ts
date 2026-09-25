import { findInstallingMember } from "@/app/_domains/integration/_services/find-installing-member";
import { findGitHubInstallationAccount } from "@/app/_domains/integration/_services/github/find-github-installation-account";
import { upsertGitHubInstallation } from "@/app/_domains/integration/_services/github/upsert-github-installation";
import { auth } from "@/server/auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
  const orgSettingsUrl = `${baseUrl}/integrations`;

  if (!installationId) {
    return NextResponse.redirect(
      `${orgSettingsUrl}?error=missing_installation_id`,
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    // Rebuild the callback URL using baseUrl to avoid protocol/host mismatches from tunnels
    const callbackUrl = `${baseUrl}/api/github/setup?installation_id=${installationId}&setup_action=${setupAction ?? "install"}`;
    return NextResponse.redirect(
      `${baseUrl}/login?nextUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }

  const activeOrganization = await auth.api.getFullOrganization({
    headers: req.headers,
  });

  if (!activeOrganization) {
    return NextResponse.redirect(`${orgSettingsUrl}?error=no_active_org`);
  }

  const installingMember = await findInstallingMember({
    organizationId: activeOrganization.id,
    userId: session.user.id,
  });

  if (!installingMember) {
    return NextResponse.redirect(`${orgSettingsUrl}?error=insufficient_role`);
  }

  const numericInstallationId = parseInt(installationId, 10);
  const account = await findGitHubInstallationAccount(numericInstallationId);

  if (!account) {
    return NextResponse.redirect(
      `${orgSettingsUrl}?error=installation_not_found`,
    );
  }

  await upsertGitHubInstallation({
    organizationId: activeOrganization.id,
    installationId: numericInstallationId,
    installedById: installingMember.id,
    account,
  });

  return NextResponse.redirect(`${orgSettingsUrl}?github=connected`);
}
