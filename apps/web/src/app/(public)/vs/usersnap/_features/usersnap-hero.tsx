import { UsersnapProjectTierAnimation } from "../_components/illustrations/usersnap-project-tier-animation";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

export function UsersnapHero() {
  return (
    <VsHero
      breadcrumbLabel="Usersnap alternatives"
      eyebrow="Usersnap alternatives"
      title="The Usersnap alternatives a small dev team should weigh"
      description="Nine tools compared on price, free plan and self-hosting, plus the open-source Usersnap alternative you install with one script tag."
      actions={
        <VsActions
          signupLabel="Start for free"
          githubLabel="View source on GitHub"
        />
      }
      illustration={<UsersnapProjectTierAnimation />}
    />
  );
}
