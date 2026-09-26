import { ErrorScreen } from "@/app/_components/error-screen";
import { UNAUTHORIZED_BOUNDARY_COPY } from "@/app/_constants/error-screens";
import { loginUrl } from "@/app/_constants/routes";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

// Destination of `unauthorized()`. Renders inside the nearest layout, so it
// carries no `<main>` landmark of its own.
export default function UnauthorizedPage() {
  return (
    <ErrorScreen
      title={UNAUTHORIZED_BOUNDARY_COPY.title}
      description={UNAUTHORIZED_BOUNDARY_COPY.description}
    >
      <Button asChild>
        <Link href={loginUrl}>{UNAUTHORIZED_BOUNDARY_COPY.signInLabel}</Link>
      </Button>
    </ErrorScreen>
  );
}
