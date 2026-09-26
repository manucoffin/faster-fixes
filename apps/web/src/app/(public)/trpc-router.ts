import { publicProcedure, router } from "@/server/trpc/trpc";
import { getGithubStars } from "./_services/get-github-stars";

export const publicRouter = router({
  getGithubStars: publicProcedure.query(() => getGithubStars()),
});
