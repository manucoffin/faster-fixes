import { domainErrorResponse } from "@/server/errors/http-response";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { agentError } from "../_helpers/agent-error";
import { isAuthFailure } from "../_helpers/is-auth-failure";
import { ListVideosQuerySchema } from "../_services/agent.schema";
import { requireAgentAuth } from "../_services/require-agent-auth";
import { listVideos } from "./_services/list-videos";

export async function GET(req: NextRequest) {
  const auth = await requireAgentAuth(
    req.headers.get("authorization"),
    "feedbacks:read",
    "agent:read",
  );
  if (isAuthFailure(auth)) return auth;
  const agentToken = auth;

  const parsed = ListVideosQuerySchema.safeParse({
    project: req.nextUrl.searchParams.get("project") ?? undefined,
  });

  if (!parsed.success) {
    return agentError("Validation failed", "VALIDATION_ERROR", 422);
  }

  try {
    const { projectId, videos } = await listVideos({
      project: parsed.data.project,
      organizationProjects: agentToken.organization.projects,
    });

    console.info(
      `[agent-api] videos:list tokenId=${agentToken.id} project=${projectId} count=${videos.length}`,
    );

    return NextResponse.json({ videos, count: videos.length });
  } catch (error) {
    const response = domainErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
