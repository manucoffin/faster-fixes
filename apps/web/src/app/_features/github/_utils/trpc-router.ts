import { router } from "@/server/trpc/trpc";
import { fetchGithubStars } from "../fetch-github-stars.trpc.query";

export const githubFeatureRouter = router({
  fetchStars: fetchGithubStars,
});
