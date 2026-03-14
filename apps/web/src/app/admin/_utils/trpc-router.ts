import { router } from "@/server/trpc/trpc";
import { dashboardRouter } from "../(dashboard)/_utils/trpc-router";
import { usersRouter } from "../utilisateurs/_utils/trpc-router";

export const adminRouter = router({
  dashboard: dashboardRouter,
  users: usersRouter,
});
