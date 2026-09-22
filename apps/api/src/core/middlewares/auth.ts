import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/api-error.js";
import { requireEnv } from "../config/db.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        emailAddress?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

type AuthUser = {
  id: string;
  emailAddress?: string;
  firstName?: string;
  lastName?: string;
};

export const authmiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const accessToken = req.cookies?.access_token;

    if (!accessToken) {
      throw ApiError.unauthorized();
    }

    const jwt_secret = requireEnv("JWT_SECRET");

    const payload = jwt.verify(accessToken, jwt_secret);

    if (typeof payload === "string" || typeof payload.id !== "string") {
      throw ApiError.unauthorized("Invalid token payload");
    }

    const user: AuthUser = {
      id: payload.id,
    };

    if (typeof payload.emailAddress === "string") {
      user.emailAddress = payload.emailAddress;
    }

    if (typeof payload.firstName === "string") {
      user.firstName = payload.firstName;
    }

    if (typeof payload.lastName === "string") {
      user.lastName = payload.lastName;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
