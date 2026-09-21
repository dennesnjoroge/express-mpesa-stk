import { Router } from "express";
import { stkPush } from "./callback.controller.js";
export const callbackRoutes: Router = Router();

callbackRoutes.post("/stk-push", stkPush);
