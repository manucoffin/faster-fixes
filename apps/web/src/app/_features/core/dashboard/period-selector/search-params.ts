import {
  createLoader,
  createSearchParamsCache,
  inferParserType,
  parseAsString,
} from "nuqs/server";

export const periodSelectorParsers = {
  from: parseAsString,
  to: parseAsString,
};

export type PeriodSelectorParsers = inferParserType<
  typeof periodSelectorParsers
>;

export const analyticsPageSearchParamsCache = createSearchParamsCache(
  periodSelectorParsers,
);

export const loadSearchParams = createLoader(periodSelectorParsers);
