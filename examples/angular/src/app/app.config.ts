import type { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideFasterFixes } from "@fasterfixes/angular";
import { routes } from "./app.routes";

const projectId = process.env.NEXT_PUBLIC_FF_API_KEY;
const apiOrigin = process.env.NEXT_PUBLIC_FF_API_ORIGIN;

if (projectId === "") {
  throw new Error(
    "Set NEXT_PUBLIC_FF_API_KEY to a Project ID, in examples/angular/.env.local or the environment.",
  );
}

// Read at each submission, so a theme switched after init is the one reported.
// The end-to-end suite flips the `dark` class to prove the value is fresh.
function readCustomMetadata() {
  return {
    app: "angular",
    colorScheme: document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFasterFixes({
      projectId,
      apiOrigin: apiOrigin === "" ? undefined : apiOrigin,
      customMetadata: readCustomMetadata,
    }),
  ],
};
