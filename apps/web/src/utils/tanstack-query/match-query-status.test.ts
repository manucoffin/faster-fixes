import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { matchQueryStatus } from "@/utils/tanstack-query/match-query-status";

type Query<TData> = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: TData | undefined;
};

function queryOf<TData>(overrides: Partial<Query<TData>>): Query<TData> {
  return {
    isLoading: false,
    isError: false,
    error: null,
    data: undefined,
    ...overrides,
  };
}

const loading = createElement("span", null, "loading");
const errored = createElement("span", null, "errored");
const empty = createElement("span", null, "empty");

function renderData(query: { data: unknown }) {
  return createElement("span", { "data-value": query.data }, "success");
}

function match<TData>(
  query: Query<TData>,
  extra: { dataKey?: string; withEmpty?: boolean } = {},
) {
  const { dataKey, withEmpty = true } = extra;
  if (!withEmpty) {
    return matchQueryStatus<TData, Query<TData>>(query, {
      Loading: loading,
      Errored: errored,
      dataKey,
      Success: renderData,
    });
  }
  return matchQueryStatus<TData, Query<TData>>(query, {
    Loading: loading,
    Errored: errored,
    Empty: empty,
    dataKey,
    Success: renderData,
  });
}

describe("matchQueryStatus", () => {
  it("renders Loading while the query is loading", () => {
    expect(match(queryOf({ isLoading: true }))).toBe(loading);
  });

  it("renders Loading before Errored when both flags are set", () => {
    expect(match(queryOf({ isLoading: true, isError: true }))).toBe(loading);
  });

  it("renders the Errored element when the query failed", () => {
    expect(match(queryOf({ isError: true, error: new Error("boom") }))).toBe(
      errored,
    );
  });

  it("passes the error to an Errored function", () => {
    const error = new Error("boom");

    const result = matchQueryStatus(
      queryOf<string[]>({ isError: true, error }),
      {
        Loading: loading,
        Errored: (received) =>
          createElement("span", null, (received as Error).message),
        Success: renderData,
      },
    );

    expect(result.props).toEqual({ children: "boom" });
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty array", []],
    ["an empty object", {}],
  ])("renders Empty when the data is %s", (_label, data) => {
    expect(match(queryOf<unknown>({ data }))).toBe(empty);
  });

  it("renders Empty when the value under dataKey is empty", () => {
    const query = queryOf({ data: { conversations: [], total: 0 } });

    expect(match(query, { dataKey: "conversations" })).toBe(empty);
  });

  it("renders Success when the value under dataKey is filled", () => {
    const data = { conversations: [{ id: "c1" }] };

    const result = match(queryOf({ data }), { dataKey: "conversations" });

    expect(result.props).toMatchObject({ "data-value": data });
  });

  it("renders Success with empty data when no Empty is given", () => {
    const result = match(queryOf<string[]>({ data: [] }), { withEmpty: false });

    expect(result.props).toMatchObject({ "data-value": [] });
  });

  it("renders Success with the data when it is filled", () => {
    const data = ["a", "b"];

    const result = match(queryOf({ data }));

    expect(result.props).toMatchObject({ "data-value": data });
  });
});
