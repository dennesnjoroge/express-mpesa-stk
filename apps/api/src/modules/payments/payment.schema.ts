import { z } from "zod";

export const stkPushSchema = z.object({
  planId: z.number(),
  phoneNumber: z.string().trim().min(10).max(15),
});

export type StkPushParams = z.infer<typeof stkPushSchema>;
