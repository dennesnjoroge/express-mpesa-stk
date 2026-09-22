import { Router } from "express";
import { getActiveSubscription } from "./subscription.controller.js";
import { authmiddleware } from "../../core/middlewares/auth.js";

export const subscriptionRoutes: Router = Router();

subscriptionRoutes.get("/", authmiddleware, getActiveSubscription);
