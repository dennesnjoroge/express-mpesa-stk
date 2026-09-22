import { Router } from "express";
import { getAllPlans } from "./plans.controller.js";

export const plansRoutes: Router = Router();

plansRoutes.get("/", getAllPlans);
