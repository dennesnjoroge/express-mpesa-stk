import type { Request, Response, NextFunction } from "express";
import { stkPushSchema } from "./payment.schema.js";
import { PaymentService } from "./payment.service.js";
import { ApiError } from "../../core/errors/api-error.js";

const paymentService = new PaymentService();

export const stkPushController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    /**
     * const kenyanPhoneRegex = /^(?:07\d{8}|011\d{7})$/;
     
     export const normalizeKenyanPhone = (phone: string): string => {
       const normalized = phone.trim().replace(/\s+/g, "");
     
       if (/^07\d{8}$/.test(normalized)) {
         return `254${normalized.slice(1)}`;
       }
     
       if (/^011\d{7}$/.test(normalized)) {
         return `254${normalized.slice(1)}`;
       }
     
       if (/^2547\d{8}$/.test(normalized)) {
         return normalized;
       }
     
       if (/^25411\d{7}$/.test(normalized)) {
         return normalized;
       }
     
       throw new Error("Invalid phone number");
     };
     */
    const user = req.user as { id?: string } | undefined;

    if (!user?.id) {
      throw ApiError.unauthorized();
    }

    const { CheckoutRequestID, MerchantRequestID } =
      await paymentService.stkPush(req.body, user.id);

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
