const GITHUB_API_URL = "https://api.github.com/repos/manucoffin/faster-fixes";

export async function getGithubStars() {
  const response = await fetch(GITHUB_API_URL, {
    headers: { Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return { stars: null };
  }

  const data = await response.json();

  return { stars: data.stargazers_count as number };
}

export type GetGithubStarsOutput = Awaited<ReturnType<typeof getGithubStars>>;
