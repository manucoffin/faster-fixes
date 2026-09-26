// The Plan vocabulary of the subscription domain: the Plan names, the
// Subscription statuses and everything the app knows about a Plan without
// asking Stripe. The Stripe plan list, which reads price identifiers from the
// environment, stays with the Better Auth configuration in `@/server/auth`.

// A `const` object plus the union of its values rather than an `enum`: the
// object still answers `SubscriptionPlanName.Pro` and `Object.values(...)`, and
// the type accepts the plain string a Stripe webhook or a database column
// carries, which a nominal enum member does not.
export const SubscriptionPlanName = {
  Free: "free",
  Pro: "pro",
  Agency: "agency",
} as const;

export type SubscriptionPlanName =
  (typeof SubscriptionPlanName)[keyof typeof SubscriptionPlanName];

export const SubscriptionStatus = {
  Incomplete: "incomplete",
  IncompleteExpired: "incomplete_expired",
  Trialing: "trialing",
  Active: "active",
  PastDue: "past_due",
  Canceled: "canceled",
  Unpaid: "unpaid",
  Paused: "paused",
} as const;

export type SubscriptionStatus =
  (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

// The Plans a Subscription can be bought on, in display order. Free is the
// absence of a Subscription, so it is not one of them. The Stripe plan list
// carries the same Plans plus their environment-bound price identifiers.
export const PAID_PLAN_NAMES = [
  SubscriptionPlanName.Pro,
  SubscriptionPlanName.Agency,
] as const;

export const PLAN_LIMITS = {
  [SubscriptionPlanName.Free]: {
    projects: 1,
    feedbacks: 50,
    seats: 1,
    organizations: 1,
    githubIntegration: false,
    linearIntegration: false,
    jiraIntegration: false,
    slackIntegration: false,
    whiteLabel: false,
  },
  [SubscriptionPlanName.Pro]: {
    projects: 5,
    feedbacks: Infinity,
    seats: 5,
    organizations: Infinity,
    githubIntegration: true,
    linearIntegration: true,
    jiraIntegration: true,
    slackIntegration: true,
    whiteLabel: true,
  },
  [SubscriptionPlanName.Agency]: {
    projects: Infinity,
    feedbacks: Infinity,
    seats: Infinity,
    organizations: Infinity,
    githubIntegration: true,
    linearIntegration: true,
    jiraIntegration: true,
    slackIntegration: true,
    whiteLabel: true,
  },
} as const;

/**
 * Hourly ceilings for the agent API, per plan. This is an abuse/runaway-loop
 * backstop, not a monetization lever — see docs/adr/0007. Numbers are set so a
 * normal Claude Code session never hits them: Free covers a full pass over the
 * 50-feedback cap (100 writes); Paid covers ~500 tickets/hour. Self-hosted is
 * unlimited (the rate-limit check is skipped entirely off cloud).
 */
export const AGENT_API_RATE_LIMITS = {
  [SubscriptionPlanName.Free]: { write: 120, read: 1000 },
  [SubscriptionPlanName.Pro]: { write: 1000, read: 5000 },
  [SubscriptionPlanName.Agency]: { write: 1000, read: 5000 },
} as const;

export const PLAN_PRICES = {
  [SubscriptionPlanName.Free]: 0,
  [SubscriptionPlanName.Pro]: 20,
  [SubscriptionPlanName.Agency]: 99,
} as const;

export const PLAN_DESCRIPTIONS = {
  [SubscriptionPlanName.Free]:
    "Get started with one project. Ideal for testing and solo use.",
  [SubscriptionPlanName.Pro]:
    "For small teams managing multiple client projects.",
  [SubscriptionPlanName.Agency]:
    "For agencies with many concurrent projects and large teams.",
};

export const PLAN_FEATURES = {
  [SubscriptionPlanName.Free]: [
    {
      id: "projects",
      label: "1 project",
      highlighted: false,
    },
    {
      id: "feedbacks",
      label: "Up to 50 feedback items",
      highlighted: false,
    },
    {
      id: "seats",
      label: "1 team member",
      highlighted: false,
    },
    {
      id: "widget",
      label: "Website feedback widget",
      highlighted: false,
    },
    {
      id: "dashboard",
      label: "Feedback management dashboard",
      highlighted: false,
    },
  ],
  [SubscriptionPlanName.Pro]: [
    {
      id: "includes_free",
      label: "Everything in Free",
      highlighted: true,
    },
    {
      id: "projects",
      label: "Up to 5 projects",
      highlighted: false,
    },
    {
      id: "feedbacks",
      label: "Unlimited feedback",
      highlighted: false,
    },
    {
      id: "seats",
      label: "Up to 5 team members",
      highlighted: false,
    },
    {
      id: "github_integration",
      label: "GitHub integration",
      highlighted: false,
    },
    {
      id: "linear_integration",
      label: "Linear integration",
      highlighted: false,
    },
    {
      id: "jira_integration",
      label: "Jira integration",
      highlighted: false,
    },
    {
      id: "slack_integration",
      label: "Slack notifications",
      highlighted: false,
    },
    {
      id: "white_label",
      label: "White-label widget",
      highlighted: false,
    },
    {
      id: "priority_email_support",
      label: "Priority email support",
      highlighted: false,
    },
  ],
  [SubscriptionPlanName.Agency]: [
    {
      id: "includes_pro",
      label: "Everything in Pro",
      highlighted: true,
    },
    {
      id: "projects",
      label: "Unlimited projects",
      highlighted: false,
    },
    {
      id: "feedbacks",
      label: "Unlimited feedback",
      highlighted: false,
    },
    {
      id: "seats",
      label: "Unlimited team members",
      highlighted: false,
    },
    {
      id: "priority_support",
      label: "Priority email support",
      highlighted: false,
    },
  ],
};
