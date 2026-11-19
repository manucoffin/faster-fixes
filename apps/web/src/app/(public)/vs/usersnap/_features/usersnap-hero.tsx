import { UsersnapProjectTierAnimation } from "../_components/illustrations/usersnap-project-tier-animation";
import { VsActions } from "../../_features/vs-actions";
import { VsHero } from "../../_features/vs-hero";

export function UsersnapHero() {
  return (
    <VsHero
      breadcrumbLabel="Usersnap alternatives"
      eyebrow="Usersnap alternatives"
      title="Usersnap alternatives: 9 tools compared for developer teams"
      description="Usersnap charges $59/mo for 2 seats, then tiers everything by project count up to $549/mo. Here are nine alternatives, what each one charges, and which of them keeps your data on your own server."
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
