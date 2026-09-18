import { router } from "@/server/trpc/trpc";
import { dashboardRouter } from "./(dashboard)/trpc-router";
import { usersRouter } from "./users/trpc-router";

export const adminRouter = router({
  dashboard: dashboardRouter,
  users: usersRouter,
});
