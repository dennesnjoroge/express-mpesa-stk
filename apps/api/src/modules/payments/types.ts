import type { RowDataPacket } from "mysql2/promise";

export type UserId = number;

export type SubscriptionId = string;

export interface StkPushServiceParams {
  phoneNumber: string;
  packageId: number;
}

export type PaymentId = bigint;

export type CheckoutRequestID = string;

export interface MarkPaymentAsSuccessfulParams {
  checkout_request_id: string;
  mpesa_receipt_number: string;
  description: string;
}

export interface Payment extends RowDataPacket {
  payment_id: string;
  subscription_id: string;
  amount: number;
  method: string;
  status: "pending" | "success" | "failed" | "cancelled";
  checkout_request_id: string | null;
  merchant_request_id: string | null;
  mpesa_receipt_number: string | null;
  created_at: Date | null;
  paid_at: Date | null;
}

export interface CreatePaymentRecordParams {
  subscription_id: string;
  amount: number;
  method: string;
}

export interface UpdatePaymentRequestIdsParams {
  paymentId: string;
  checkoutRequestId: string;
}

export interface MarkPaymentAsFailedByCheckoutRequestIdParams {
  checkout_request_id: string;
  description: string;
}

export interface UpdateCancelledPaymentParams {
  checkout_request_id: string;
  description: string;
}

export interface RequestIds {
  CheckoutRequestID: string;
  MerchantRequestID: string;
}

export interface StkPushParams {
  amount: number;
  phoneNumber: string;
}
