import { isPlayPauseShortcut } from "@/app/_domains/video/_helpers/is-play-pause-shortcut";
import { readRecordingFile } from "@/app/_domains/feedback/_helpers/read-recording-file";
import {
  buildDashboardMessage,
  type DashboardMessage,
  parsePlayerMessage,
} from "@/app/_domains/feedback/_helpers/recording-player-protocol";
import { useTRPC } from "@/lib/trpc/trpc-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  answerPlayerMessage,
  INITIAL_RECORDING_STAGE,
  isSelectionFrameShown,
  RECORDING_HANDSHAKE_TIMEOUT_MS,
  type RecordingFile,
  type RecordingSpeed,
  reduceRecordingStage,
  seekRecording,
  togglePlayback,
  viewRecordingStage,
} from "../../_helpers/recording-stage";

/**
 * The dashboard's side of the player document (ADR-0023): it fetches and
 * reads the Recording file, hands the events to the framed player and folds
 * the player's answers into the stage. The replayer itself only ever runs in
 * the frame.
 */
export function useRecordingStage(feedbackId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [speed, setSpeedState] = useState<RecordingSpeed>(1);
  const [stage, dispatch] = useReducer(
    reduceRecordingStage,
    INITIAL_RECORDING_STAGE,
  );

  // A file that cannot be fetched or read resolves with its cause, never
  // throws, since every cause leads to the same notice.
  const fileQuery = useQuery({
    queryKey: ["recording-events", feedbackId],
    queryFn: async (): Promise<RecordingFile> => {
      try {
        const playback = await queryClient.fetchQuery(
          trpc.authenticated.projects.feedback.getRecordingPlayback.queryOptions(
            { feedbackId },
          ),
        );
        if (!playback.readable) {
          return { readable: false, cause: "unreadable-on-server" };
        }
        const response = await fetch(`/api/feedback/${feedbackId}/recording`);
        if (!response.ok) return { readable: false, cause: "not-fetched" };
        const file = await readRecordingFile({
          file: await response.arrayBuffer(),
          formatVersion: playback.formatVersion,
        });
        return file.readable ? file : { readable: false, cause: file.reason };
      } catch {
        return { readable: false, cause: "not-fetched" };
      }
    },
    // The file is fixed at creation; it is read once per opening.
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
  const file = fileQuery.data;
  const events = file?.readable ? file.events : null;
  const view = viewRecordingStage(file, stage);

  const post = useCallback((message: DashboardMessage) => {
    frameRef.current?.contentWindow?.postMessage(
      buildDashboardMessage(message),
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    if (!events || !frame) return;
    let loadSent = false;

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (!frame || event.source !== frame.contentWindow) return;
      const message = parsePlayerMessage(event.data);
      if (!message) return;

      if (message.type === "ready" && !loadSent && events) {
        loadSent = true;
        post({ type: "load", events });
      }
      answerPlayerMessage(message).forEach(post);
      dispatch(message);
    }

    window.addEventListener("message", onMessage);
    // Either side may be ready first: the player answers this with `ready`.
    post({ type: "listening" });
    const timeout = window.setTimeout(() => {
      dispatch({ type: "handshakeTimeout" });
    }, RECORDING_HANDSHAKE_TIMEOUT_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timeout);
    };
  }, [events, post]);

  const toggle = () => togglePlayback(stage).forEach(post);
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    // The player fills a dialog, which would otherwise keep Space for itself.
    const surface = frameRef.current?.closest('[role="dialog"]') ?? null;
    if (!isPlayPauseShortcut(event, { surface })) return;
    // Also keeps Space from clicking a focused button.
    event.preventDefault();
    toggle();
  });

  useEffect(() => {
    if (!events) return;
    // Capture runs before React's handlers, which sit on the root.
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      document.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [events]);

  return {
    frameRef,
    events,
    status: view.status,
    areControlsEnabled: view.areControlsEnabled,
    isResourceNoticeShown: view.isResourceNoticeShown,
    state: stage.state,
    time: stage.time,
    duration: stage.duration,
    isOnSelectionInstant: isSelectionFrameShown(stage),
    speed,
    togglePlayback: toggle,
    seek: (time: number) => seekRecording(stage, time).forEach(post),
    setSpeed: (next: RecordingSpeed) => {
      setSpeedState(next);
      // A speed set before the Recording has loaded applies once it has.
      post({ type: "speed", speed: next });
    },
  };
}
