import { Router } from "express";
import {
  stkPushController,
  paymentStatusController,
} from "./payment.controller.js";

export const paymentRoutes: Router = Router();

paymentRoutes.post("/stk-push", stkPushController);
paymentRoutes.post("/payment-status", paymentStatusController);
