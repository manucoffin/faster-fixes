import { auth } from "@/server/auth";
import { s3Client } from "@/server/storage";
import { requireEnv } from "@/utils/environment/require-env";
import { RejectUpload, route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";
import { z } from "zod";
import { findUploadingMember } from "./_services/find-uploading-member";

const routes: Router["routes"] = {
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
        throw new RejectUpload("Unauthorized");
      }

      const uploadingMember = await findUploadingMember({
        organizationId: clientMetadata.organizationId,
        userId: session.user.id,
      });

      if (!uploadingMember) {
        throw new RejectUpload(
          "You do not have permission to modify this organization.",
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
  "user-avatar": route({
    fileTypes: ["image/png", "image/jpeg", "image/webp"],
    maxFileSize: 2 * 1024 * 1024,
    onBeforeUpload: async ({ req, file }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session) {
        throw new RejectUpload("Unauthorized");
      }

      const extension = file.type.split("/")[1] ?? "png";

      return {
        objectInfo: {
          key: `user-avatars/${session.user.id}/${Date.now()}.${extension}`,
        },
      };
    },
  }),
};

// Built per request so a missing bucket name fails the upload, not the module import.
export function POST(req: Request) {
  const router: Router = {
    client: s3Client,
    bucketName: requireEnv(
      "STORAGE_BUCKET_NAME",
      process.env.STORAGE_BUCKET_NAME,
    ),
    routes,
  };
  return toRouteHandler(router).POST(req);
}
