import { ErrorScreen } from "@/app/_components/error-screen";
import { FORBIDDEN_BOUNDARY_COPY } from "@/app/_constants/error-screens";

// Destination of `forbidden()`, which has no caller yet: ADR-0012 defers the
// RSC interrupt helper to its first caller. Renders inside the nearest layout,
// so it carries no `<main>` landmark of its own.
export default function ForbiddenPage() {
  return (
    <ErrorScreen
      title={FORBIDDEN_BOUNDARY_COPY.title}
      description={FORBIDDEN_BOUNDARY_COPY.description}
    />
  );
}
