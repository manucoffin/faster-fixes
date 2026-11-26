// PROTOTYPE, throwaway (issue 491): never merge into dev or main.
import { FakeSite } from "./_features/fake-site.client";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function NarratedWidgetPrototypePage({
  searchParams,
}: PageProps) {
  const { page } = await searchParams;
  return <FakeSite page={page ?? "catalog"} />;
}
