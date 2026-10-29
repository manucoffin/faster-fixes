// An Engaged organization received at least one Feedback in the window, across
// any of its Projects (CONTEXT.md). Shared so every figure built on it agrees.
export function getEngagedOrganizationWhere(gte: Date, lt: Date) {
  return {
    projects: { some: { feedback: { some: { createdAt: { gte, lt } } } } },
  };
}
