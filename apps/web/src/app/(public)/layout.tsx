import { LayoutParams } from "@/types/next";
import { Footer } from "../_features/core/footer/footer";
import { Header } from "../_features/core/header/header.server";

export default function PublicLayout({ children }: LayoutParams) {
  return (
    <div>
      <Header />
      {children}

      <Footer />
    </div>
  )
}