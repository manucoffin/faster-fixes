import type { inferParserType } from "nuqs/server";
import {
  createLoader,
  createSearchParamsCache,
  parseAsString,
} from "nuqs/server";

export const periodSelectorParsers = {
  from: parseAsString,
  to: parseAsString,
};

export type PeriodSelectorParsers = inferParserType<
  typeof periodSelectorParsers
>;

export const periodSelectorSearchParamsCache = createSearchParamsCache(
  periodSelectorParsers,
);

export const loadSearchParams = createLoader(periodSelectorParsers);
