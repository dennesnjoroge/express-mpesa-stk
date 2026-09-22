import type { Request, Response, NextFunction } from "express";
import { plansService } from "./plans.service.js";

export const getAllPlans = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const plans = await plansService.getAll();

    return res.status(200).json(plans);
  } catch (error) {
    next(error);
  }
};
