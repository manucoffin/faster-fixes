import { s3Client } from "@/server/storage";
import { route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";

const router: Router = {
  client: s3Client,
  bucketName: "my-bucket",
  routes: {
    images: route({
      fileTypes: ["image/*"],
      multipleFiles: true,
      maxFiles: 4,
    }),
  },
};

export const { POST } = toRouteHandler(router);
