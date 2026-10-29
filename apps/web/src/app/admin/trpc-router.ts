import { router } from "@/server/trpc/trpc";
import { dashboardRouter } from "./(dashboard)/trpc-router";
import { testimonialsRouter } from "./testimonials/trpc-router";
import { usersRouter } from "./users/trpc-router";

export const adminRouter = router({
  dashboard: dashboardRouter,
  testimonials: testimonialsRouter,
  users: usersRouter,
});
