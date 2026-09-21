import type { Request, Response, NextFunction } from "express";
import { CallbackService } from "./callback.service.js";

const callbackService = new CallbackService();

export const stkPush = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Accepted",
  });

  try {
    const { ResultCode, CheckoutRequestID, ResultDesc } =
      req.body?.Body?.stkCallback;
    const metadata = req.body?.Body?.stkCallback?.CallbackMetadata?.Item;
    const receiptItem = metadata?.find(
      (item: { Name: string }) => item.Name === "MpesaReceiptNumber",
    );

    const receiptNumber = receiptItem?.Value;

    const isProcessed = await callbackService.stkPush({
      ResultCode,
      CheckoutRequestID,
      ResultDesc,
      receiptNumber,
    });
  } catch (error) {
    console.error(
      "[CRITICAL CONTROLLER ERROR - MPESA CALLBACK] Exception caught inside background webhook processor:",
      error,
    );
  }
};
