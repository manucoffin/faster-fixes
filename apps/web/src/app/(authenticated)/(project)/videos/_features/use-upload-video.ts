import type { VideoFileClassification } from "@/app/_domains/video/_helpers/classify-video-file";
import { checkVideoUploadQuota } from "@/app/_domains/video/_helpers/check-video-upload-quota";
import { describeVideoFileClassification } from "@/app/_domains/video/_helpers/describe-video-file-classification";
import { getVideoTitleFromFileName } from "@/app/_domains/video/_helpers/get-video-title-from-file-name";
import { parseVideoQuotaDenial } from "@/app/_domains/video/_helpers/parse-video-quota-denial";
import { useTRPC } from "@/lib/trpc/trpc-client";
import type { VideoQuotaDenial } from "@/server/auth/subscription/check-video-quota";
import { uploadFile, useUploadFile } from "@better-upload/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import {
  UploadVideoSchema,
  type UploadVideoInput,
} from "../_services/upload-video.schema";
import { captureVideoPoster } from "./capture-video-poster";
import { readVideoFileClassification } from "./read-video-file-classification";

type PickedFile = {
  file: File;
  // null while the bytes are being read.
  classification: VideoFileClassification | null;
};

/**
 * The upload dialog's state: the file check, the pre-flight quota, the
 * transfer through the `video` upload route and the commit that follows it.
 */
export function useUploadVideo({
  projectId,
  onUploaded,
}: {
  projectId: string;
  onUploaded: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [serverDenial, setServerDenial] = useState<VideoQuotaDenial | null>(
    null,
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  // Replaced on every pick: the upload hook reads the signal it is given at
  // the render that starts the transfer.
  const [abortController, setAbortController] = useState(
    () => new AbortController(),
  );
  // Captured while the file is checked, uploaded once the Video row exists.
  const posterRef = useRef<Promise<Blob | null>>(Promise.resolve(null));
  const posterKeyRef = useRef<Promise<string | undefined>>(
    Promise.resolve(undefined),
  );

  const form = useForm<UploadVideoInput>({
    resolver: zodResolver(UploadVideoSchema),
    defaultValues: { title: "" },
    mode: "onChange",
  });

  const usageQuery = useQuery(
    trpc.authenticated.projects.video.getUsage.queryOptions({ projectId }),
  );
  const usage = usageQuery.data?.isCloud ? usageQuery.data : null;

  const refreshVideos = () =>
    Promise.all([
      queryClient.invalidateQueries(
        trpc.authenticated.projects.video.list.queryFilter({ projectId }),
      ),
      queryClient.invalidateQueries(
        trpc.authenticated.projects.video.getUsage.queryFilter({ projectId }),
      ),
    ]);

  const showServerError = (message: string) => {
    const denial = parseVideoQuotaDenial(message);
    setServerDenial(denial);
    setServerError(denial ? null : message);
  };

  const completeUploadMutation = useMutation(
    trpc.authenticated.projects.video.completeUpload.mutationOptions({
      onSuccess: () => {
        toast.success("Video uploaded");
        onUploaded();
      },
      onError: (error) => showServerError(error.message),
      onSettled: () => refreshVideos(),
    }),
  );

  const deleteVideoMutation = useMutation(
    trpc.authenticated.projects.video.delete.mutationOptions({
      onSettled: () => refreshVideos(),
    }),
  );

  const { control } = useUploadFile({
    route: "video",
    signal: abortController.signal,
    onUploadBegin: ({ metadata }) => {
      if (typeof metadata.videoId === "string") {
        setVideoId(metadata.videoId);
        posterKeyRef.current = uploadPoster({
          videoId: metadata.videoId,
          poster: posterRef.current,
          signal: abortController.signal,
        });
      }
      // The row now exists in `uploading` state.
      void refreshVideos();
    },
    onUploadComplete: async ({ metadata }) => {
      if (typeof metadata.videoId === "string") {
        const posterKey = await posterKeyRef.current;
        await completeUploadMutation
          .mutateAsync({ videoId: metadata.videoId, posterKey })
          .catch(() => undefined);
      }
    },
    onError: (error) => {
      if (error.type !== "aborted") {
        showServerError(error.message);
      }
    },
  });

  const isTransferring = control.isPending || completeUploadMutation.isPending;
  const progress = control.progress;

  useEffect(() => {
    if (!isTransferring) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isTransferring]);

  const pickFile = async (file: File) => {
    control.reset();
    setServerDenial(null);
    setServerError(null);
    setVideoId(null);
    setAbortController(new AbortController());
    setPicked({ file, classification: null });
    posterRef.current = captureVideoPoster(file);
    posterKeyRef.current = Promise.resolve(undefined);
    form.reset({ title: getVideoTitleFromFileName(file.name) });

    const classification = await readVideoFileClassification(file);
    // A later pick wins over a slower read of an earlier file.
    setPicked((current) =>
      current?.file === file ? { file, classification } : current,
    );
  };

  const notice = picked?.classification
    ? describeVideoFileClassification(picked.classification)
    : null;
  const preflightDenial =
    picked && usage ? checkVideoUploadQuota(usage, picked.file.size) : null;
  const denial = serverDenial ?? preflightDenial;

  // Read from the value, not formState.isValid: reset() leaves isValid at
  // the empty default title until the field is edited.
  const title = useWatch({ control: form.control, name: "title" });
  const hasValidTitle = UploadVideoSchema.safeParse({ title }).success;

  const accepted =
    picked?.classification?.kind === "accepted" ? picked.classification : null;
  const canUpload =
    accepted !== null &&
    hasValidTitle &&
    denial === null &&
    !isTransferring &&
    !completeUploadMutation.isSuccess;

  const upload = form.handleSubmit(async ({ title }) => {
    if (!picked || !accepted || !canUpload) {
      return;
    }
    setServerDenial(null);
    setServerError(null);
    await control.upload(picked.file, {
      metadata: {
        projectId,
        title,
        durationMs: accepted.durationMs,
        width: accepted.width,
        height: accepted.height,
        videoCodec: accepted.videoCodec,
        hasFastStart: accepted.hasFastStart,
      },
    });
  });

  // An abandoned transfer leaves an `uploading` row; it is removed now rather
  // than left for the reaper.
  const cancel = () => {
    abortController.abort();
    if (videoId && !completeUploadMutation.isSuccess) {
      deleteVideoMutation.mutate({ videoId });
    }
  };

  return {
    form,
    picked,
    notice,
    denial,
    plan: usage?.plan ?? null,
    isCloud: usage !== null,
    serverError,
    canUpload,
    isTransferring,
    progress,
    pickFile,
    upload,
    cancel,
  };
}

// A failed Poster is not reported: the Video falls back to the generic icon.
async function uploadPoster({
  videoId,
  poster,
  signal,
}: {
  videoId: string;
  poster: Promise<Blob | null>;
  signal: AbortSignal;
}) {
  try {
    const blob = await poster;
    if (!blob) {
      return undefined;
    }
    const { file } = await uploadFile({
      route: "video-poster",
      file: new File([blob], "poster.jpg", { type: "image/jpeg" }),
      metadata: { videoId },
      signal,
    });
    return file.objectInfo.key;
  } catch {
    return undefined;
  }
}
