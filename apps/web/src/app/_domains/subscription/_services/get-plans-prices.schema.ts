import { z } from "zod";

export const GetPlansPricesSchema = z.object({
  planNames: z.array(z.string()),
});

export type GetPlansPricesInput = z.infer<typeof GetPlansPricesSchema>;
