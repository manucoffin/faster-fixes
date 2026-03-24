import { auth } from "@/server/auth";
import { getAppOctokit } from "@/server/github/github-app";
import { prisma } from "@workspace/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  const baseUrl = process.env.BETTER_AUTH_URL ?? process.env.BASE_URL!;
  const orgSettingsUrl = `${baseUrl}/organization?tab=integrations`;

  if (!installationId) {
    return NextResponse.redirect(
      `${orgSettingsUrl}&error=missing_installation_id`,
    );
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    // Rebuild the callback URL using baseUrl to avoid protocol/host mismatches from tunnels
    const callbackUrl = `${baseUrl}/api/github/setup?installation_id=${installationId}&setup_action=${setupAction ?? "install"}`;
    return NextResponse.redirect(
      `${baseUrl}/sign-in?callbackURL=${encodeURIComponent(callbackUrl)}`,
    );
  }

  const activeOrganization = await auth.api.getFullOrganization({
    headers: req.headers,
  });

  if (!activeOrganization) {
    return NextResponse.redirect(`${orgSettingsUrl}&error=no_active_org`);
  }

  const activeOrgId = activeOrganization.id;

  // Only owner/admin can install
  const membership = await prisma.member.findFirst({
    where: {
      organizationId: activeOrgId,
      userId: session.user.id,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    return NextResponse.redirect(`${orgSettingsUrl}&error=insufficient_role`);
  }

  if (setupAction === "update") {
    // Repo selection changed — no DB update needed, repos are fetched live
    return NextResponse.redirect(`${orgSettingsUrl}&github=updated`);
  }

  // Verify the installation exists on GitHub
  const numericInstallationId = parseInt(installationId, 10);
  let installationData: {
    account: { login: string; type: string; avatar_url?: string };
  };

  try {
    const appOctokit = getAppOctokit();
    const response = await appOctokit.request(
      "GET /app/installations/{installation_id}",
      { installation_id: numericInstallationId },
    );
    installationData = response.data as typeof installationData;
  } catch {
    return NextResponse.redirect(
      `${orgSettingsUrl}&error=installation_not_found`,
    );
  }

  // Upsert: update if installation already exists for this org
  await prisma.gitHubInstallation.upsert({
    where: { installationId: numericInstallationId },
    update: {
      accountLogin: installationData.account.login,
      accountType: installationData.account.type,
      accountAvatarUrl: installationData.account.avatar_url ?? null,
    },
    create: {
      organizationId: activeOrgId,
      installationId: numericInstallationId,
      accountLogin: installationData.account.login,
      accountType: installationData.account.type,
      accountAvatarUrl: installationData.account.avatar_url ?? null,
      installedById: membership.id,
    },
  });

  return NextResponse.redirect(`${orgSettingsUrl}&github=connected`);
}
