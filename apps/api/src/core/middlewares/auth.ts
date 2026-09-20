import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/api-error.js";
import { requireEnv } from "../config/db.js";

declare global {
  namespace Express {
    interface Request {
      user?: string | jwt.JwtPayload;
    }
  }
}

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

    const verifiedData = jwt.verify(accessToken, jwt_secret);
    req.user = verifiedData;
    next();
  } catch (error) {
    next(error);
  }
};
