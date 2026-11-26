// PROTOTYPE, throwaway (issue #500): never merge into dev or main.
import { PrototypeShell } from "./_features/prototype-shell.client";

type PageProps = {
  searchParams: Promise<{ variant?: string }>;
};

export default async function NarratedRecordingPrototypePage({
  searchParams,
}: PageProps) {
  const { variant } = await searchParams;
  return <PrototypeShell variant={variant ?? "A"} />;
}
