// index routes
import { Router } from "express";
import { paymentRoutes } from "./modules/payments/payment.routes.js";

export const router: Router = Router();

router.use("/payments", paymentRoutes);
