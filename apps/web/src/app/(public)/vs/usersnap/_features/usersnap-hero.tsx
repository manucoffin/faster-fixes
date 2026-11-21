import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

export function UsersnapHero() {
  return (
    <VsHero
      breadcrumbLabel="Usersnap alternatives"
      eyebrow="Usersnap alternatives"
      title="The Usersnap alternatives a small dev team should weigh"
      description="Nine tools compared on price, free plan and self-hosting. Usersnap suits enterprise product teams. For a dev team fixing client sites, the open-source option installs with one script tag and costs $0 to self-host."
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
    />
  );
}
