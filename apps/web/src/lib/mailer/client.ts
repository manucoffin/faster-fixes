import "server-only";

import { createMailer } from "./mailer-factory";

export const mailer = createMailer();

export type { Mailer } from "./types";
