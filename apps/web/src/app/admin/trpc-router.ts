import { usersRouter } from "@/app/admin/users/_utils/trpc-router";
import { router } from "@/server/trpc/trpc";
import { dashboardRouter } from "./(dashboard)/trpc-router";

export const adminRouter = router({
  dashboard: dashboardRouter,
  users: usersRouter,
});
