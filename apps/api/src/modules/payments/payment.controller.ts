import type { Request, Response, NextFunction } from "express";
import { stkPushSchema } from "./payment.schema.js";
import { PaymentService } from "./payment.service.js";

const paymentService = new PaymentService();

export const stkPushController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { CheckoutRequestID, MerchantRequestID } =
      await paymentService.stkPush(req.body);

    res.status(200).json({
      status: "success",
      message:
        "Payment initiated successfully. Check your phone and enter your M-Pesa PIN.",
      CheckoutRequestID,
      MerchantRequestID,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentStatusController = () => {};
