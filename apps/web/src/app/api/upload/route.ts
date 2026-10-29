import { findOpenTestimonialRequest } from "@/app/_domains/testimonial/_services/find-open-testimonial-request";
import { getTestimonialUploadPrefix } from "@/app/_domains/testimonial/_helpers/testimonial-photo-keys";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { createStorage } from "@/server/storage";
import { getStorageBucket } from "@/server/storage/config";
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
  // The public Testimonial form has no session: the request token authorizes
  // the upload, under the same limits as the avatar.
  "testimonial-photo": route({
    fileTypes: ["image/png", "image/jpeg", "image/webp"],
    maxFileSize: 2 * 1024 * 1024,
    clientMetadataSchema: z.object({
      token: z.string().min(1).max(200),
    }),
    onBeforeUpload: async ({ file, clientMetadata }) => {
      const { allowed } = await checkRateLimit(
        clientMetadata.token,
        "testimonial-token",
      );

      if (!allowed) {
        throw new RejectUpload("Too many uploads. Try again later.");
      }

      const request = await findOpenTestimonialRequest({
        token: clientMetadata.token,
        now: new Date(),
      });

      if (!request) {
        throw new RejectUpload("This link no longer works.");
      }

      const extension = file.type.split("/")[1] ?? "png";

      return {
        objectInfo: {
          key: `${getTestimonialUploadPrefix(request.id)}${Date.now()}.${extension}`,
        },
      };
    },
  }),
};

// Built per request so a missing bucket name fails the upload, not the module import.
export function POST(req: Request) {
  const router: Router = {
    client: createStorage().uploadClient,
    bucketName: getStorageBucket(),
    routes,
  };
  return toRouteHandler(router).POST(req);
}
