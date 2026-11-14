import Link from "next/link";
import { featureLinks } from "@/app/(public)/_components/feature-links";

export function FeatureCards() {
  return (
    <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {featureLinks.map((feature) => (
        <li
          key={feature.slug}
          id={feature.slug}
          className="flex scroll-mt-20 flex-col rounded-lg border p-6"
        >
          <h2 className="text-xl font-semibold">{feature.title}</h2>
          <p className="mt-2 flex-1 text-muted-foreground">
            {feature.description}
          </p>
          {feature.linkLabel && (
            <Link
              href={feature.href}
              className="mt-4 text-sm font-medium underline underline-offset-4 hover:no-underline"
            >
              {feature.linkLabel}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
