// index routes
import { Router } from "express";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { paymentRoutes } from "./modules/payments/payment.routes.js";
import { callbackRoutes } from "./modules/callbacks/callback.routes.js";
import { subscriptionRoutes } from "./modules/subscriptions/subscription.routes.js";
import { plansRoutes } from "./modules/plans/plans.routes.js";

export const router: Router = Router();

router.use("/auth", authRoutes);
router.use("/payments", paymentRoutes);
router.use("/callbacks", callbackRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/plans", plansRoutes);
