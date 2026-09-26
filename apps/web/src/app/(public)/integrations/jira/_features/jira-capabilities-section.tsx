import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

const capabilities = [
  {
    title: "Status sync that survives custom workflows",
    body: "Status changes flow both ways. Sync keys on Jira's status category: To Do, In Progress, Done. It does not key on the status name, so renamed statuses and custom workflows keep working.",
  },
  {
    title: "Issues created with the data engineers need",
    body: "Each issue carries the client's comment, the page URL, the React component path, source file and CSS selector, a screenshot link, and the browser, OS, console logs and network errors captured at submission.",
  },
  {
    title: "Track the issue key without leaving Faster Fixes",
    body: "The Faster Fixes inbox shows a Jira badge with the issue key (e.g. PROJ-123) and a status dot. A feedback item can be linked to Jira, GitHub, Linear, any combination, or none.",
  },
];

export function JiraCapabilitiesSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Built for Jira admins
          </p>
          <h2 className="text-3xl font-bold md:text-4xl">
            Status sync built for custom Jira workflows
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Most feedback tools sync a status name, and break the first time an
            admin renames one. Faster Fixes syncs the category instead.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
          {capabilities.map((capability) => (
            <Card key={capability.title} className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{capability.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {capability.body}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
