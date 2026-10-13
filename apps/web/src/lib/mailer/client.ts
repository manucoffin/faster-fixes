import "server-only";

import { createMailer } from "./mailer-factory";
import type { Mailer } from "./types";

let instance: Mailer | undefined;
const getMailer = () => (instance ??= createMailer());

export const mailer: Mailer = {
  get emails() {
    return getMailer().emails;
  },
  get contacts() {
    return getMailer().contacts;
  },
};

export type { Mailer } from "./types";
