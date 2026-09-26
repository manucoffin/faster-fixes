import { z } from "zod";

const GITHUB_API_URL = "https://api.github.com/repos/manucoffin/faster-fixes";

const GithubRepositorySchema = z.object({
  stargazers_count: z.number(),
});

export async function getGithubStars() {
  const response = await fetch(GITHUB_API_URL, {
    headers: { Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return { stars: null };
  }

  const parsed = GithubRepositorySchema.safeParse(await response.json());

  return { stars: parsed.success ? parsed.data.stargazers_count : null };
}

export type GetGithubStarsOutput = Awaited<ReturnType<typeof getGithubStars>>;
