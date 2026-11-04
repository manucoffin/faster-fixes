import { getTestimonialUploadPrefix } from "@/app/_domains/testimonial/_helpers/testimonial-photo-keys";
import { findOpenTestimonialRequest } from "@/app/_domains/testimonial/_services/find-open-testimonial-request";
import {
  getVideoPosterKey,
  getVideoSourceKey,
  VIDEO_MIME_TYPES,
} from "@/app/_domains/video/_helpers/video-object-keys";
import { createVideo } from "@/app/_domains/video/_services/create-video";
import { findUploadingVideo } from "@/app/_domains/video/_services/find-uploading-video";
import { auth } from "@/server/auth";
import { checkRateLimit } from "@/server/rate-limit/check-rate-limit";
import { createStorage } from "@/server/storage";
import { DomainError } from "@/server/errors/domain-errors";
import { getStorageBucket, getStorageProvider } from "@/server/storage/config";
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

// R2 requires every part but the last to be the same size, so never adaptive.
const VIDEO_PART_SIZE = 16 * 1024 * 1024;

// The largest per-file cap of any Plan; the Organization's own cap is checked
// by the quota.
const VIDEO_MAX_FILE_SIZE = 4_000_000_000;

// The local provider's upload client signs single PUTs only.
function videoRoute(multipart: boolean) {
  return route({
    fileTypes: VIDEO_MIME_TYPES,
    maxFileSize: VIDEO_MAX_FILE_SIZE,
    multipart,
    partSize: VIDEO_PART_SIZE,
    clientMetadataSchema: z.object({
      projectId: z.string().min(1),
      title: z.string().trim().min(1).max(200).optional(),
      durationMs: z.number().int().nonnegative(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      videoCodec: z.enum(["avc1", "avc3"]),
      hasFastStart: z.boolean(),
    }),
    onBeforeUpload: async ({ req, file, clientMetadata }) => {
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session) {
        throw new RejectUpload("Unauthorized");
      }

      const { projectId, title, ...media } = clientMetadata;
      const { denial, video } = await createVideo({
        projectId,
        userId: session.user.id,
        file,
        title,
        media,
      }).catch(rejectDomainError);

      // The upload dialog parses the denial to show the same message it
      // would have shown before the request.
      if (denial) {
        throw new RejectUpload(JSON.stringify(denial));
      }

      return {
        objectInfo: {
          key: getVideoSourceKey({ ...video, mimeType: file.type }),
        },
        metadata: { videoId: video.id },
      };
    },
    onAfterSignedUrl: ({ metadata }) => ({ metadata }),
  });
}

function rejectDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    throw new RejectUpload(error.message);
  }
  throw error;
}

const videoPosterRoute = route({
  fileTypes: ["image/jpeg"],
  maxFileSize: 1_000_000,
  clientMetadataSchema: z.object({
    videoId: z.string().min(1),
  }),
  onBeforeUpload: async ({ req, clientMetadata }) => {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      throw new RejectUpload("Unauthorized");
    }

    const video = await findUploadingVideo({
      videoId: clientMetadata.videoId,
      userId: session.user.id,
    });

    if (!video) {
      throw new RejectUpload("This video is not being uploaded.");
    }

    return {
      objectInfo: { key: getVideoPosterKey(video) },
    };
  },
});

// Built per request so a missing bucket name fails the upload, not the module import.
export function POST(req: Request) {
  const router: Router = {
    client: createStorage().uploadClient,
    bucketName: getStorageBucket(),
    routes: {
      ...routes,
      video: videoRoute(getStorageProvider() !== "local"),
      "video-poster": videoPosterRoute,
    },
  };
  return toRouteHandler(router).POST(req);
}
