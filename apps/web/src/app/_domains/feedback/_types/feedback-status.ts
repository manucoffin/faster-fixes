import type { z } from "zod";

import type { FeedbackStatusEnum } from "../_helpers/feedback-status";

export type FeedbackStatus = z.infer<typeof FeedbackStatusEnum>;
