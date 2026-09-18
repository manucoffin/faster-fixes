import { LayoutParams } from "@/types/next";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header.server";
import { LaunchBanner } from "./_components/launch-banner.client";

export default function PublicLayout({ children }: LayoutParams) {
  return (
    <div>
      <LaunchBanner />
      <Header />
      {children}

      <Footer />
    </div>
  );
}
