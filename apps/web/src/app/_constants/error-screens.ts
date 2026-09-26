// Fixed copy for the route boundaries, which all render `ErrorScreen`
// (`@/app/_components/error-screen`). A boundary never renders `error.message`
// or `digest`, so every word a user reads about a failure is in this module.

export const ERROR_BOUNDARY_COPY = {
  title: "Something went wrong",
  description:
    "An unexpected error occurred. Try again, or contact support if the problem persists.",
  retryLabel: "Try again",
} as const;

export const NOT_FOUND_BOUNDARY_COPY = {
  title: "Page not found",
  description: "The page you are looking for does not exist or has been moved.",
} as const;

export const FORBIDDEN_BOUNDARY_COPY = {
  title: "Access denied",
  description: "You do not have permission to view this page.",
} as const;

export const UNAUTHORIZED_BOUNDARY_COPY = {
  title: "Sign in required",
  description: "Sign in to access this page.",
  signInLabel: "Sign in",
} as const;
