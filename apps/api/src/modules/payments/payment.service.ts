import { stkPush } from "./stk-push.js";
import { pool } from "../../core/config/db.js";
import type { RequestIds, PaymentId } from "./types.js";
import { ApiError } from "../../core/errors/api-error.js";
import { PaymentRepository } from "./payment.repository.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { SubscriptionRepository } from "../subscriptions/subscription.repository.js";
import { StkPushParams } from "./payment.schema.js";

const paymentRepository = new PaymentRepository();
const authRepository = new AuthRepository();
const subscriptionRepository = new SubscriptionRepository();

export class PaymentService {
  async stkPush(params: StkPushParams): Promise<RequestIds> {
    const { firstName, lastName, emailAddress, stkPushPhoneNumber } = params;

    const amount = 100;
    const paymentId = crypto.randomUUID();
    const subscriptionId = crypto.randomUUID();
    let planId = 1;

    const userId = crypto.randomUUID();

    // --------------------------------
    // 1. Create subscription + payment
    // --------------------------------

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // create a pending user
      await authRepository.createUser(
        {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email_address: emailAddress,
        },
        connection,
      );

      // expire expired subscription
      await subscriptionRepository.expireExpiredSubscriptionByUserId(
        userId,
        connection,
      );

      // prevent multiple subscriptions
      const activeSubscription =
        await subscriptionRepository.getCurrentSubscriptionByUserId(
          userId,
          connection,
        );

      if (activeSubscription) {
        throw ApiError.conflict("You already have an active subscription.");
      }

      await subscriptionRepository.createSubscriptionRecord(
        {
          subscription_id: subscriptionId,
          user_id: userId,
          plan_id: planId,
        },
        connection,
      );

      await paymentRepository.createPaymentRecord(
        {
          payment_id: paymentId,
          subscription_id: subscriptionId,
          amount,
          method: "m-pesa",
        },
        connection,
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    // --------------------------------
    // 2. Initiate STK Push
    // --------------------------------

    try {
      const result = await stkPush({ amount, phoneNumber: stkPushPhoneNumber });

      const CheckoutRequestID = result.CheckoutRequestID;
      const MerchantRequestID = result.MerchantRequestID;

      if (!CheckoutRequestID) {
        throw new Error(
          `M-Pesa did not return CheckoutRequestID. Payment ID: ${paymentId}`,
        );
      }

      // --------------------------------
      // 3. Save M-Pesa request IDs
      // --------------------------------
      const connection = await pool.getConnection();

      try {
        await paymentRepository.updatePaymentRequestId(
          {
            paymentId,
            checkoutRequestId: CheckoutRequestID,
            merchantRequestId: MerchantRequestID,
          },
          connection,
        );
      } catch (error) {
        throw error;
      } finally {
        connection.release();
      }

      return result;
    } catch (error) {
      const connection = await pool.getConnection();

      try {
        await connection.beginTransaction();

        await paymentRepository.markPaymentAsFailed(paymentId, connection);
        await subscriptionRepository.markSubscriptionAsFailed(
          subscriptionId,
          connection,
        );

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      throw error;
    }
  }
}
