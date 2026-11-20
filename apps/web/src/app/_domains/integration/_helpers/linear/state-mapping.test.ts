import { describe, expect, it } from "vitest";
import type { FeedbackStatus } from "@/app/_domains/feedback";
import {
  feedbackStatusFromLinearStateType,
  isLinearStateTypeMirroring,
  resolveLinearStateToWrite,
  type LinearStateType,
  type LinearTeamState,
} from "./state-mapping";

const allTypes: LinearStateType[] = [
  "triage",
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
];

const allStatuses: FeedbackStatus[] = [
  "new",
  "in_progress",
  "resolved",
  "closed",
];

const fullTeam: LinearTeamState[] = [
  { id: "triage", type: "triage" },
  { id: "backlog", type: "backlog" },
  { id: "todo", type: "unstarted" },
  { id: "doing", type: "started" },
  { id: "done", type: "completed" },
  { id: "canceled", type: "canceled" },
];

describe("resolveLinearStateToWrite", () => {
  const rows: Array<{
    case: string;
    states: LinearTeamState[];
    defaultStateId?: string;
    status: FeedbackStatus;
    write: { stateId: string; fellBack: boolean } | null;
  }> = [
    {
      case: "the default state for new",
      states: fullTeam,
      defaultStateId: "backlog",
      status: "new",
      write: { stateId: "backlog", fellBack: false },
    },
    {
      case: "a not-started state when the default state is gone",
      states: fullTeam.slice(1),
      defaultStateId: "removed",
      status: "new",
      write: { stateId: "backlog", fellBack: true },
    },
    {
      case: "started for in_progress",
      states: fullTeam,
      status: "in_progress",
      write: { stateId: "doing", fellBack: false },
    },
    {
      case: "completed for resolved",
      states: fullTeam,
      status: "resolved",
      write: { stateId: "done", fellBack: false },
    },
    {
      case: "canceled for closed",
      states: fullTeam,
      status: "closed",
      write: { stateId: "canceled", fellBack: false },
    },
    {
      case: "completed for closed on a team without canceled",
      states: fullTeam.slice(0, 5),
      status: "closed",
      write: { stateId: "done", fellBack: true },
    },
    {
      case: "the first state when the team has no state of the type",
      states: fullTeam.slice(0, 3),
      status: "in_progress",
      write: { stateId: "triage", fellBack: true },
    },
    {
      case: "nothing for a team without states",
      states: [],
      status: "resolved",
      write: null,
    },
  ];

  it.each(rows)(
    "writes $case",
    ({ states, defaultStateId = "todo", status, write }) => {
      const resolved = resolveLinearStateToWrite({
        states,
        defaultStateId,
        status,
      });
      expect(
        resolved && { stateId: resolved.stateId, fellBack: resolved.fellBack },
      ).toEqual(write);
    },
  );

  it("returns the type of the state it writes", () => {
    expect(
      resolveLinearStateToWrite({
        states: fullTeam,
        defaultStateId: "todo",
        status: "resolved",
      }),
    ).toMatchObject({ stateType: "completed" });
  });
});

describe("feedbackStatusFromLinearStateType", () => {
  const rows: Array<{ type: string; status: FeedbackStatus }> = [
    { type: "triage", status: "new" },
    { type: "backlog", status: "new" },
    { type: "unstarted", status: "new" },
    { type: "started", status: "in_progress" },
    { type: "completed", status: "resolved" },
    { type: "canceled", status: "closed" },
    { type: "a type Linear adds later", status: "new" },
  ];

  it.each(rows)("$type implies $status", ({ type, status }) => {
    expect(feedbackStatusFromLinearStateType(type)).toBe(status);
  });
});

describe("isLinearStateTypeMirroring", () => {
  const mirrored: Record<LinearStateType, FeedbackStatus> = {
    triage: "new",
    backlog: "new",
    unstarted: "new",
    started: "in_progress",
    completed: "resolved",
    canceled: "closed",
  };
  const rows = allTypes.flatMap((type) =>
    allStatuses.map((status) => ({
      type,
      status,
      mirrors: mirrored[type] === status,
    })),
  );

  it.each(rows)(
    "$type mirrors $status: $mirrors",
    ({ type, status, mirrors }) => {
      expect(isLinearStateTypeMirroring(type, status)).toBe(mirrors);
    },
  );
});
