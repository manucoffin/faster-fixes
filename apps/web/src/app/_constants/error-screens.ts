// Fixed copy for the route boundaries, which all render `ErrorScreen`
// (`@/app/_components/error-screen`). A boundary never renders `error.message`
// or `digest`, so every word a user reads about a failure is in this module.

export const ERROR_BOUNDARY_COPY = {
  title: "Something went wrong",
  description:
    "An unexpected error occurred. Try again, or contact support if the problem persists.",
  retryLabel: "Try again",
} as const;
