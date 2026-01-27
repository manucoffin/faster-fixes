import { RichText } from "@/app/_features/payload/_components/rich-text";
import { getPayloadClient } from "@/lib/payload/client";
import { H1 } from "@workspace/ui/components/headings";

export default async function PrivacyPolicyPage() {
  const payload = await getPayloadClient();
  const pageData = await payload.findGlobal({
    slug: "privacy-policy-page",
    depth: 0,
  });

  return (
    <>
      <H1 className="text-primary mb-8 self-start text-left">
        {pageData?.pageTitle || "Politique de confidentialité"}
      </H1>

      {pageData?.pageContent ? (
        <RichText data={pageData.pageContent} />
      ) : (
        <p className="text-muted-foreground">
          Aucun contenu disponible pour le moment.
        </p>
      )}
    </>
  );
}
