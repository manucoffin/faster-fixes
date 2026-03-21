const COOKIE_NAME = "active-project-id";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

export function getActiveProjectId(): string | undefined {
  if (typeof document === "undefined") return undefined;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));

  return match?.split("=")[1];
}

export function setActiveProjectId(projectId: string): void {
  document.cookie = `${COOKIE_NAME}=${projectId}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearActiveProjectId(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
