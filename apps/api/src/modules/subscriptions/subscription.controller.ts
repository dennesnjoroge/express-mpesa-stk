import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../../core/errors/api-error.js";
import { subscriptionService } from "./subscription.service.js";

export const getActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized();
    }

    const subscription =
      await subscriptionService.getActiveSubscription(userId);

    return res.status(200).json({
      subscription,
    });
  } catch (error) {
    next(error);
  }
};
