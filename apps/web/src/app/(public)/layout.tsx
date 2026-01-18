import { LayoutParams } from "@/types/next";
import { Header } from "../_features/core/header/header.server";

export default function PublicLayout({ children }: LayoutParams) {
    return <div>
        <Header />
        {children}
    </div>
}