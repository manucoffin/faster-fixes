import crypto from "crypto";

export function generatePublicId() {
  return "proj_" + crypto.randomBytes(12).toString("hex");
}
