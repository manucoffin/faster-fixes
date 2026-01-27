import { RichText } from "@/app/_features/payload/_components/rich-text";
import { H1 } from "@workspace/ui/components/headings";

export default async function TermsPage() {
  const payload = await getPayloadClient();
  const pageData = await payload.findGlobal({
    slug: "terms-and-conditions-page",
    depth: 0,
  });

  return (
    <>
      <H1 className="text-primary mb-8 self-start">
        {pageData?.pageTitle || "Conditions générales d'utilisation"}
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
