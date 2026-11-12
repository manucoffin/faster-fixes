/**
 * The dashboard's own route for a Recording file: the player fetches it from
 * the dashboard's origin, so the bucket needs no cross-origin rule and local
 * disk storage works the same. The gzip bytes are sent as they are stored,
 * without `Content-Encoding`, so the browser never inflates them past the
 * reader's bound on decompressed size.
 */

import { auth } from "@/server/auth";
import { domainErrorResponse } from "@/server/errors/http-response";
import { getRecordingFile } from "./_services/get-recording-file";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/feedback/:id/recording — the Recording file, for a Member
export async function GET(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const file = await getRecordingFile({
      feedbackId: id,
      userId: session.user.id,
    });
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Length": String(file.byteLength),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const response = domainErrorResponse(error);
    if (response) return response;
    throw error;
  }
}
