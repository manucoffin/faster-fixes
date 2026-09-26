/**
 * A page that installs the Widget. Every scenario in `widget.spec.ts` runs
 * once per fixture, so a new Embed is covered by adding an entry here.
 */
type WidgetFixture = {
  name: string;
  path: string;
};

export const WIDGET_FIXTURES: WidgetFixture[] = [
  // The root layout mounts the React Embed; the login page renders it without
  // a database or a cloud-only route.
  { name: "app layout (React Embed)", path: "/login" },
  // A static page served by the app outside production, loading the built IIFE
  // under a hostile stylesheet.
  { name: "static page (script embed)", path: "/e2e/script-embed" },
];
