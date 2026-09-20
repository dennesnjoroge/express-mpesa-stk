import { Router } from "express";
import { register } from "./auth.controller";

export const authRoutes: Router = Router();

authRoutes.post("/register", register);
