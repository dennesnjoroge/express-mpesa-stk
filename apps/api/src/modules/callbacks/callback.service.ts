import { pool } from "../../core/config/db.js";
import { PlansRepository } from "../plans/plans.repository.js";
import { PaymentRepository } from "../payments/payment.repository.js";
import { SubscriptionRepository } from "../subscriptions/subscription.repository.js";

interface CallbackServiceParams {
  ResultCode: number;
  CheckoutRequestID: string;
  ResultDesc: string;
  receiptNumber: string;
}

const paymentRepository = new PaymentRepository();
const subscriptionRepository = new SubscriptionRepository();
const plansRepository = new PlansRepository();

export class CallbackService {
  async stkPush(params: CallbackServiceParams): Promise<boolean> {
    const { ResultCode, CheckoutRequestID, ResultDesc, receiptNumber } = params;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const paymentRecord =
        await paymentRepository.getPaymentRecordByCheckoutRequestId(
          CheckoutRequestID,
          connection,
        );

      if (!paymentRecord) {
        console.error(
          `[M-Pesa Webhook Error] Payment record not found for CheckoutRequestID: ${CheckoutRequestID}`,
        );
        await connection.rollback();
        return false;
      }

      if (paymentRecord.status === "success") {
        await connection.rollback();
        return true;
      }

      const subscriptionRecord =
        await subscriptionRepository.getSubscriptionBySubscriptionId(
          paymentRecord.subscription_id,
          connection,
        );

      if (!subscriptionRecord) {
        console.error(
          `[M-Pesa Webhook Error] Subscription missing. ID: ${paymentRecord.subscription_id}`,
        );
        await connection.rollback();
        return false;
      }

      // Customer cancelled the payment CASE 1
      if (ResultCode === 1032) {
        await paymentRepository.markPaymentAsCancelled(
          CheckoutRequestID,
          connection,
        );

        await subscriptionRepository.markSubscriptionAsFailed(
          paymentRecord.subscription_id,
          connection,
        );

        await connection.commit();
        return true;
      }

      // CASE 2
      if (ResultCode !== 0) {
        await paymentRepository.markPaymentAsFailed(
          paymentRecord.payment_id,
          connection,
        );

        await subscriptionRepository.markSubscriptionAsFailed(
          paymentRecord.subscription_id,
          connection,
        );

        await connection.commit();
        return true;
      }

      // CASE 3 Payment successful
      const pkg = await plansRepository.getById(subscriptionRecord.plan_id);

      if (!pkg) {
        console.error(
          `[M-Pesa Webhook Error] Package metadata missing. PackageID: ${subscriptionRecord.package_id}`,
        );
        await connection.rollback();
        return false;
      }

      const paymentUpdated = await paymentRepository.markPaymentAsSuccessful(
        CheckoutRequestID,
        receiptNumber,
        connection,
      );

      const startAt = new Date();
      const expiresAt = new Date(startAt.getTime() + 2592000000); // 30 days

      await subscriptionRepository.markSubscriptionAsSuccessful(
        {
          subscription_id: paymentRecord.subscription_id,
          start_at: startAt,
          expires_at: expiresAt,
        },
        connection,
      );
      /*
      const subscriptionUpdated = await markSubscriptionAsSuccessful(
        {
          subscription_id: paymentRecord.subscription_id,
          start_at: startAt,
          expires_at: expiresAt,
        },

        connection,
      );

      /*
      if (!paymentUpdated || !subscriptionUpdated) {
        console.error(
          `[M-Pesa Webhook Error] Failed writing Success state to DB. CheckoutRequestID: ${CheckoutRequestID}`,
        );
        await connection.rollback();
        return false;
      }
        */

      await connection.commit();
      return true;
    } catch (error: any) {
      console.error(error);
      console.error(
        `[CRITICAL WEBHOOK - MPESA CALLBACK - RUNTIME EXCEPTION]: ${error?.message || error}`,
      );

      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "[CRITICAL] Inner transaction rollback crash:",
          rollbackError,
        );
      }

      return false;
    } finally {
      connection.release();
    }
  }
}

/*
// old version: may contain bugs
export const callbackService = async (
  params: CallbackServiceParams,
): Promise<boolean> => {
  const { ResultCode, CheckoutRequestID, ResultDesc, receiptNumber } = params;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const paymentRecord =
      await paymentRepository.getPaymentRecordByCheckoutRequestId(
        CheckoutRequestID,
        connection,
      );

    if (!paymentRecord) {
      console.error(
        `[M-Pesa Webhook Error] Payment record not found for CheckoutRequestID: ${CheckoutRequestID}`,
      );
      await connection.rollback();
      return false;
    }

    if (paymentRecord.status === "success") {
      await connection.rollback();
      return true;
    }

    const subscriptionRecord =
      await subscriptionRepository.getSubscriptionBySubscriptionId(
        paymentRecord.subscription_id,
        connection,
      );

    if (!subscriptionRecord) {
      console.error(
        `[M-Pesa Webhook Error] Subscription missing. ID: ${paymentRecord.subscription_id}`,
      );
      await connection.rollback();
      return false;
    }

    // Customer cancelled the payment CASE 1
    if (ResultCode === 1032) {
      const paymentUpdated = await markPaymentAsCancelled(
        {
          checkout_request_id: CheckoutRequestID,
          description: ResultDesc,
        },
        connection,
      );

      const subscriptionUpdated = await markSubscriptionAsCancelled(
        paymentRecord.subscription_id,
        connection,
      );

      if (!paymentUpdated || !subscriptionUpdated) {
        console.error(
          `[M-Pesa Webhook Error] Failed writing Cancellation to DB. CheckoutRequestID: ${CheckoutRequestID}`,
        );
        await connection.rollback();
        return false;
      }

      await connection.commit();
      return true;
    }

    // CASE 2
    if (ResultCode !== 0) {
      const paymentUpdated = await markPaymentAsFailedByCheckoutRequestId(
        {
          checkout_request_id: CheckoutRequestID,
          description: ResultDesc,
        },
        connection,
      );

      const subscriptionUpdated = await markSubscriptionAsFailed(
        paymentRecord.subscription_id,
        connection,
      );

      if (!paymentUpdated || !subscriptionUpdated) {
        console.error(
          `[M-Pesa Webhook Error] Failed writing Failure state to DB. CheckoutRequestID: ${CheckoutRequestID}`,
        );
        await connection.rollback();
        return false;
      }

      await connection.commit();
      return true;
    }

    // CASE 3 Payment successful
    const pkg = await getPackageById(subscriptionRecord.package_id);

    if (!pkg) {
      console.error(
        `[M-Pesa Webhook Error] Package metadata missing. PackageID: ${subscriptionRecord.package_id}`,
      );
      await connection.rollback();
      return false;
    }

    const paymentUpdated = await markPaymentAsSuccessful(
      {
        checkout_request_id: CheckoutRequestID,
        mpesa_receipt_number: receiptNumber,
        description: ResultDesc,
      },
      connection,
    );

    const startAt = new Date();
    const expiresAt = new Date(startAt.getTime() + Number(pkg.duration_ms));

    const subscriptionUpdated = await markSubscriptionAsSuccessful(
      {
        subscription_id: paymentRecord.subscription_id,
        start_at: startAt,
        expires_at: expiresAt,
      },

      connection,
    );

    if (!paymentUpdated || !subscriptionUpdated) {
      console.error(
        `[M-Pesa Webhook Error] Failed writing Success state to DB. CheckoutRequestID: ${CheckoutRequestID}`,
      );
      await connection.rollback();
      return false;
    }

    await connection.commit();
    return true;
  } catch (error: any) {
    console.error(
      `[CRITICAL WEBHOOK - MPESA CALLBACK - RUNTIME EXCEPTION]: ${error?.message || error}`,
    );

    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "[CRITICAL] Inner transaction rollback crash:",
        rollbackError,
      );
    }

    return false;
  } finally {
    connection.release();
  }
};
*/
