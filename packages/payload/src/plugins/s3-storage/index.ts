import { s3Storage } from "@payloadcms/storage-s3";

export const s3StoragePlugin = s3Storage({
  collections: {
    media: {
      prefix: "cms/media", // upload files inside cms/media folder in the bucket.
      generateFileURL: ({ filename, prefix }) => {
        const hostname = `${process.env.PAYLOAD_S3_BUCKET}.s3.${process.env.PAYLOAD_S3_REGION}.amazonaws.com`;
        const baseUrl = `https://${hostname}`;

        return prefix
          ? `${baseUrl}/${prefix}/${filename}`
          : `${baseUrl}/${filename}`;
      },
    },
  },
  bucket: process.env.PAYLOAD_S3_BUCKET || "",
  config: {
    credentials: {
      accessKeyId: process.env.PAYLOAD_S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.PAYLOAD_S3_SECRET_ACCESS_KEY || "",
    },
    region: process.env.PAYLOAD_S3_REGION,
    // ... Other S3 configuration
  },
});
