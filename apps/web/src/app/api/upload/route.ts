import { auth } from "@/server/auth";
import { s3Client } from "@/server/storage";
import { RejectUpload, route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";
import { prisma } from "@workspace/db";
import { z } from "zod";

const router: Router = {
  client: s3Client,
  bucketName: process.env.S3_BUCKET_NAME!,
  routes: {
    "organization-logo": route({
      fileTypes: ["image/png", "image/jpeg", "image/webp"],
      maxFileSize: 2 * 1024 * 1024,
      clientMetadataSchema: z.object({
        organizationId: z.string(),
      }),
      onBeforeUpload: async ({ req, file, clientMetadata }) => {
        const session = await auth.api.getSession({
          headers: req.headers,
        });

        if (!session) {
          throw new RejectUpload("Non autorisé");
        }

        const membership = await prisma.member.findFirst({
          where: {
            organizationId: clientMetadata.organizationId,
            userId: session.user.id,
            role: { in: ["owner", "admin"] },
          },
        });

        if (!membership) {
          throw new RejectUpload(
            "Vous n'avez pas les permissions pour modifier cette organisation.",
          );
        }

        const extension = file.type.split("/")[1] ?? "png";

        return {
          objectInfo: {
            key: `organization-logos/${clientMetadata.organizationId}/${Date.now()}.${extension}`,
          },
        };
      },
    }),
  },
};

export const { POST } = toRouteHandler(router);
