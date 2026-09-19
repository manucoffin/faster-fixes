import { ErrorScreen } from "@/app/_components/error-screen";
import { NOT_FOUND_BOUNDARY_COPY } from "@/app/_constants/error-screens";

// No `<main>` landmark: unlike the error boundaries, this file renders inside
// the nearest layout, and the admin and authenticated layouts already own one.
export default function NotFoundPage() {
  return (
    <ErrorScreen
      title={NOT_FOUND_BOUNDARY_COPY.title}
      description={NOT_FOUND_BOUNDARY_COPY.description}
    />
  );
}
