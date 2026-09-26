import { Router } from "express";
import {
  register,
  login,
  currentAuthUser,
  logout,
  deleteUser,
  resendVerification,
  verifyEmail,
  forgotPassword,
} from "./auth.controller.js";
import { authmiddleware } from "../../core/middlewares/auth.js";

export const authRoutes: Router = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", authmiddleware, currentAuthUser);
authRoutes.post("/logout", authmiddleware, logout);
authRoutes.post("/delete", authmiddleware, deleteUser);
authRoutes.post("/resend-verification", resendVerification);
authRoutes.post("/verify-email", verifyEmail);
authRoutes.post("/forgot-password", forgotPassword);
