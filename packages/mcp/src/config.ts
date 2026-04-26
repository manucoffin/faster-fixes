type Config = {
  token: string;
  project: string;
  baseUrl: string;
};

export function loadConfig(): Config {
  const token = process.env.FASTER_FIXES_TOKEN;
  const project = process.env.FASTER_FIXES_PROJECT;
  const baseUrl =
    process.env.FASTER_FIXES_URL ?? "https://www.faster-fixes.com";

  if (!token) {
    process.stderr.write(
      "Error: FASTER_FIXES_TOKEN environment variable is required.\n",
    );
    process.exit(1);
  }

  if (!project) {
    process.stderr.write(
      "Error: FASTER_FIXES_PROJECT environment variable is required.\n",
    );
    process.exit(1);
  }

  return { token, project, baseUrl };
}
