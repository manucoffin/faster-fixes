import { z } from "zod";

export const GetMonthlyStatsSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});
