import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";

const authService = new AuthService();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { firstName, lastName, emailAddress, phoneNumber, password } =
      req.body;

    await authService.register(req.body);

    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};
