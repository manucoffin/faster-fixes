/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  typedRoutes: true,

  experimental: {
    authInterrupts: true,
  },

  // async rewrites() {
  //   return [
  //     {
  //       source: "/login",
  //       destination: "/connexion",
  //     },
  //     {
  //       source: "/signup",
  //       destination: "/inscription",
  //     },
  //     {
  //       source: "/forgot-password",
  //       destination: "/mot-de-passe-oublie",
  //     },
  //     {
  //       source: "/reset-password",
  //       destination: "/reinitialiser-mot-de-passe",
  //     },
  //   ];
  // },
};

export default nextConfig;
