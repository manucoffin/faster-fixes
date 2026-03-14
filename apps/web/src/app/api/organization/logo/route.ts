import { auth } from "@/server/auth";
import { del, put } from "@vercel/blob";
import { prisma } from "@workspace/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const EXTENSION_MAP: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const organizationId = formData.get("organizationId") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "Aucun fichier fourni" },
      { status: 400 },
    );
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: "ID de l'organisation requis" },
      { status: 400 },
    );
  }

  const membership = await prisma.member.findFirst({
    where: {
      organizationId,
      userId: session.user.id,
      role: { in: ["owner", "admin"] },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Vous n'avez pas les permissions pour modifier cette organisation." },
      { status: 403 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Type de fichier non supporté. Utilisez PNG, JPEG ou WebP." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Le fichier ne doit pas dépasser 2 Mo." },
      { status: 400 },
    );
  }

  // Delete previous logo if it exists
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { logo: true },
  });

  if (org?.logo) {
    try {
      await del(org.logo);
    } catch {
      // Old blob may already be deleted, continue
    }
  }

  const extension = EXTENSION_MAP[file.type] ?? "png";
  const filename = `organization-logos/${organizationId}/${Date.now()}.${extension}`;
  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
