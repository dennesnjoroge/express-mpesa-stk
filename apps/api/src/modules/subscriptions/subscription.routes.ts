import { Router } from "express";
import {
  getActiveSubscription,
  cancelSubscription,
} from "./subscription.controller.js";
import { authmiddleware } from "../../core/middlewares/auth.js";

export const subscriptionRoutes: Router = Router();

subscriptionRoutes.get("/", authmiddleware, getActiveSubscription);
subscriptionRoutes.post("/cancel", authmiddleware, cancelSubscription);
