export const rootUrl = "/";
export const loginUrl = "/connexion";
export const signupUrl = "/inscription";
export const forgotPasswordUrl = "/mot-de-passe-oublie";
export const resetPasswordUrl = "/reinitialiser-mot-de-passe";
export const onboardingUrl = "/premiers-pas";
export const billingUrl = "/mon-compte/facturation";
export const organisationUrl = "/mon-compte/organisation";
export const invitationsUrl = "/mon-compte/invitations";

// Redirects
export const defaultRedirect = "/mon-compte";

// Utils Routes
export const unauthorizedUrl = "/unauthorized";
export const notFoundUrl = "/404";
export const internalServerErrorUrl = "/500";
export const privacyPolicyUrl = "/politique-de-confidentialite";
export const termsUrl = "/cgu";

export const authRoutes = [
  loginUrl,
  signupUrl,
  forgotPasswordUrl,
  resetPasswordUrl,
];
export const publicRoutes = [
  ...authRoutes,
  notFoundUrl,
  internalServerErrorUrl,
  unauthorizedUrl,
  termsUrl,
  privacyPolicyUrl,
  "/",
  "/blog/*",
  "/settings",
  "/support",
  "/professionnels/*",
  "/auteurs/*",
  "/partenaires",
];
export const adminRoutes = ["/admin"];

export const appRoutes = [...publicRoutes, ...adminRoutes];
