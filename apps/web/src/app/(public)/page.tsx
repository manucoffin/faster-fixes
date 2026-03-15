import { APP_URL } from "@/app/_constants/app";
import { SITE_META_DESCRIPTION, SITE_NAME } from "@/app/_constants/seo";
import { OrganizationSchema } from "@/app/_features/seo/organization-schema";
import { WebSiteSchema } from "@/app/_features/seo/website-schema";
import { Button } from "@workspace/ui/components/button"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_META_DESCRIPTION,
  alternates: {
    canonical: APP_URL,
  },
};

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-svh">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Hello World</h1>
        <Button size="sm">Button</Button>
      </div>

      <OrganizationSchema />
      <WebSiteSchema />
    </div>
  )
}
