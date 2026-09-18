import { router } from "@/server/trpc/trpc";
import { fetchGithubStars } from "../fetch-github-stars.trpc.query";

export const githubStarsFeatureRouter = router({
  fetchStars: fetchGithubStars,
});
