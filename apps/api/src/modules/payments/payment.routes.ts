import { Router } from "express";
import { stkPushController, paymentStatus } from "./payment.controller.js";
import { authmiddleware } from "../../core/middlewares/auth.js";

export const paymentRoutes: Router = Router();

paymentRoutes.post("/stk-push", authmiddleware, stkPushController);
paymentRoutes.get("/status", authmiddleware, paymentStatus);
