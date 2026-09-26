// stk push utility function
import dayjs from "dayjs";
import axios from "axios";
import { getAccessToken } from "./access-token.js";
import type { RequestIds, StkPushParams } from "./types.js";
import { requireEnv } from "./access-token.js";

export const stkPush = async (params: StkPushParams): Promise<RequestIds> => {
  const { amount, phoneNumber, accountReference } = params;

  const accessToken = await getAccessToken();
  const timestamp = dayjs().format("YYYYMMDDHHmmss");

  const DARAJA_API_URL = requireEnv("DARAJA_API_URL");
  const DARAJA_API_CALLBACK_URL = requireEnv("DARAJA_API_CALLBACK_URL");
  const MPESA_SHORTCODE = requireEnv("MPESA_SHORTCODE");
  const MPESA_PASSKEY = requireEnv("MPESA_PASSKEY");

  const transactionDesc = "Plan Subscription";

  const password = Buffer.from(
    `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `${DARAJA_API_CALLBACK_URL}/v1/callbacks/stk-push`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  try {
    const response = await axios.post(
      `${DARAJA_API_URL}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const CheckoutRequestID = response.data?.CheckoutRequestID;
    const MerchantRequestID = response.data?.MerchantRequestID;

    if (!CheckoutRequestID || !MerchantRequestID) {
      throw new Error(
        "M-Pesa did not return CheckoutRequestID or MerchantRequestID.",
      );
    }

    return { CheckoutRequestID, MerchantRequestID };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Daraja STK Push failed:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    throw error;
  }
};
