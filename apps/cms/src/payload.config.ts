import { configurePayload } from "@workspace/payload/configure-payload";
import path from "node:path";
import { fileURLToPath } from "node:url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default configurePayload({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname, "src"),
      importMapFile: path.resolve(dirname, "app", "importMap.js"),
    },
  },
});
