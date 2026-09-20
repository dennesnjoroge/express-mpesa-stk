import { Router } from "express";
import { register, login, currentAuthUser, logout } from "./auth.controller";
import { authmiddleware } from "../../core/middlewares/auth";

export const authRoutes: Router = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", authmiddleware, currentAuthUser);
authRoutes.post("/logout", authmiddleware, logout);
