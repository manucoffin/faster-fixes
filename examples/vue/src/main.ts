import { createFasterFixes } from "@fasterfixes/vue";
import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router";

const projectId: unknown = import.meta.env.NEXT_PUBLIC_FF_API_KEY;
const apiOrigin: unknown = import.meta.env.NEXT_PUBLIC_FF_API_ORIGIN;

if (typeof projectId !== "string" || projectId === "") {
  throw new Error(
    "Set NEXT_PUBLIC_FF_API_KEY to a Project ID, in examples/vue/.env.local or the environment.",
  );
}

// Read at each submission, so a theme switched after init is the one reported.
// The end-to-end suite flips the `dark` class to prove the value is fresh.
function readCustomMetadata() {
  return {
    app: "vue",
    colorScheme: document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  };
}

createApp(App)
  .use(router)
  .use(
    createFasterFixes({
      projectId,
      apiOrigin: typeof apiOrigin === "string" ? apiOrigin : undefined,
      customMetadata: readCustomMetadata,
    }),
  )
  .mount("#app");
