import { inngest } from "@/server/inngest";
import { helloWorld } from "@/server/inngest/example";
import { serve } from "inngest/next";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloWorld],
});
