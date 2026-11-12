/**
 * The widget API's HTTP boundary for a Feedback Recording: Project resolution,
 * the Allowed origins match, the Reviewer token, the multipart parse and the
 * `DomainError` mapping live here, so the `_services/` functions below stay
 * transport-agnostic.
 *
 * No rate limit, as for the Screenshot: a Recording attaches once to a
 * Feedback whose creation already spent a `submit` slot. No Plan check either:
 * Recording is outside Plan logic.
 */

import { isAllowedOrigin } from "@/app/_domains/project/_helpers/is-allowed-origin";
import { findProjectByPublicId } from "@/app/_domains/project/_services/find-project-by-public-id";
import { findReviewerByToken } from "@/app/_domains/project/_services/find-reviewer-by-token";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { widgetErrorResponse } from "../../_helpers/widget-error-response";
import { createFeedbackRecording } from "../../_services/create-feedback-recording";
import { getFeedbackAwaitingRecording } from "../../_services/get-feedback-awaiting-recording";
import { updateFeedbackRecording } from "../../_services/update-feedback-recording";
import { UpdateFeedbackRecordingSchema } from "../../_services/update-feedback-recording.schema";

type RouteParams = { params: Promise<{ id: string }> };

// Below the cloud host's 4.5 MB request body limit, multipart overhead included.
const RECORDING_MAX_BYTES = 4 * 1024 * 1024;

// PUT /api/v1/feedback/:id/recording — attach a Recording after creation
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const project = await findProjectByPublicId(req.headers.get("x-api-key"));
  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAllowedOrigin(req.headers, project.domain)) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  const reviewerToken = req.headers.get("x-reviewer-token");
  const reviewer = await findReviewerByToken(reviewerToken, project.id);
  if (!reviewer) {
    return NextResponse.json(
      { error: "Invalid reviewer token" },
      { status: 403 },
    );
  }

  try {
    await getFeedbackAwaitingRecording({
      feedbackId: id,
      projectId: project.id,
      reviewerId: reviewer.id,
    });

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const recordingField = formData.get("recording");
    if (!(recordingField instanceof File)) {
      return NextResponse.json(
        { error: "Missing recording file" },
        { status: 400 },
      );
    }

    if (recordingField.size > RECORDING_MAX_BYTES) {
      return NextResponse.json(
        { error: "Recording exceeds 4MB limit" },
        { status: 413 },
      );
    }

    const fields = UpdateFeedbackRecordingSchema.safeParse({
      durationMs: formData.get("durationMs"),
      formatVersion: formData.get("formatVersion"),
    });
    if (!fields.success) {
      return NextResponse.json(
        { error: "Invalid recording duration or format version" },
        { status: 400 },
      );
    }

    const recordingId = await createFeedbackRecording({
      projectId: project.id,
      body: Buffer.from(await recordingField.arrayBuffer()),
    });

    await updateFeedbackRecording({
      feedbackId: id,
      recordingId,
      ...fields.data,
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const response = widgetErrorResponse(error);
    if (!response) throw error;
    return response;
  }
}
