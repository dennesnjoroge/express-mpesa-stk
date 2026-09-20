// index routes
import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { paymentRoutes } from "./modules/payments/payment.routes.js";

export const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/payments", paymentRoutes);
