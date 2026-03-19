import { usersRouter } from "@/app/admin/users/_utils/trpc-router";
import { router } from "@/server/trpc/trpc";
import { dashboardRouter } from "../(dashboard)/_utils/trpc-router";

export const adminRouter = router({
  dashboard: dashboardRouter,
  users: usersRouter,
});
