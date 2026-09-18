import { z } from "zod";

export const stkPushSchema = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  emailAddress: z.string().trim().email().toLowerCase(),
  stkPushPhoneNumber: z.string().trim().min(10).max(15),
});

export type StkPushParams = z.infer<typeof stkPushSchema>;
