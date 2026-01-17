import { type UseQueryResult } from "@tanstack/react-query";
import { JSX } from "react";

type QueryLike<TData> = {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  data: TData | undefined;
};

/**
 * Match the state of a query to a set of components.
 *
 * Useful for rendering different UI based on the state of a query.
 * Works with both Tanstack Query and tRPC query results.
 *
 * **Note:** if you don't provide an `Empty` component and the query is empty,
 * the data in the Success component will be also typed as undefined.
 * @example ```jsx
 * const query = useQuery({... });
 * return matchQueryStatus(query, {
 *   Loading: <Loading />,
 *   Errored: <Errored />,
 *   Success: ({ data }) => <Data data={data} />
 *   //          ^ type of T | null
 * })
 * ```
 * If you provide an `Empty` component, the data will be typed as non-nullable.
 * You can also specify a custom path to check for emptiness.
 * @example ```jsx
 * const query = useQuery({... });
 *
 * return matchQueryStatus(query, {
 *    Loading: <Loading />,
 *    Errored: <Error />,
 *    Empty: <Empty />,
 *    dataKey: "conversations", // Will check data.conversations
 *    Success: ({ data }) => <Data data={data} />,
 *    //          ^ type of data is T
 * });
 * ```
 */
export function matchQueryStatus<
  T,
  TQuery extends QueryLike<T> = UseQueryResult<T>,
>(
  query: TQuery,
  options: {
    Loading: JSX.Element;
    Errored: JSX.Element | ((error: unknown) => JSX.Element);
    Empty: JSX.Element;
    dataKey?: string;
    Success: (
      data: TQuery & {
        data: NonNullable<T>;
      },
    ) => JSX.Element;
  },
): JSX.Element;
export function matchQueryStatus<
  T,
  TQuery extends QueryLike<T> = UseQueryResult<T>,
>(
  query: TQuery,
  options: {
    Loading: JSX.Element;
    Errored: JSX.Element | ((error: unknown) => JSX.Element);
    dataKey?: string;
    Success: (data: TQuery) => JSX.Element;
  },
): JSX.Element;
export function matchQueryStatus<
  T,
  TQuery extends QueryLike<T> = UseQueryResult<T>,
>(
  query: TQuery,
  {
    Loading,
    Errored,
    Empty,
    dataKey,
    Success,
  }: {
    Loading: JSX.Element;
    Errored: JSX.Element | ((error: unknown) => JSX.Element);
    Empty?: JSX.Element;
    dataKey?: string;
    Success: (data: TQuery) => JSX.Element;
  },
): JSX.Element {
  // placeholder for label
  if (query.isLoading) {
    return Loading;
  }

  if (query.isError) {
    if (typeof Errored === "function") {
      return Errored(query.error);
    }
    return Errored;
  }

  const checkValue =
    dataKey && query.data
      ? query.data[dataKey as keyof typeof query.data]
      : query.data;

  const isEmpty =
    checkValue === undefined ||
    checkValue === null ||
    (Array.isArray(checkValue) && checkValue.length === 0) ||
    (typeof checkValue === "object" && Object.keys(checkValue).length === 0);

  if (isEmpty && Empty) {
    return Empty;
  }

  return Success(query);
}
