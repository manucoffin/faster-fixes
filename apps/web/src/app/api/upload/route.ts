import { route, type Router } from "@better-upload/server";
import { toRouteHandler } from "@better-upload/server/adapters/next";
import { aws } from "@better-upload/server/clients";

const router: Router = {
  client: aws(), // or cloudflare(), backblaze(), tigris(), ...
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
