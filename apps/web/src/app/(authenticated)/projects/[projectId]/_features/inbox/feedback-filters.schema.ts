import { parseAsString } from "nuqs";

export const feedbackFiltersParsers = {
  pageUrl: parseAsString,
  sort: parseAsString.withDefault("newest"),
  feedbackId: parseAsString,
};
