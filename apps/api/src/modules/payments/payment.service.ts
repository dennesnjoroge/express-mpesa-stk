import { randomUUID } from "node:crypto";
import { stkPush } from "./stk-push.js";
import { pool } from "../../core/config/db.js";
import type { RequestIds } from "./types.js";
import { ApiError } from "../../core/errors/api-error.js";
import { PaymentRepository } from "./payment.repository.js";
import { SubscriptionRepository } from "../subscriptions/subscription.repository.js";
import { PlansRepository } from "../plans/plans.repository.js";
import type { StkPushParams } from "./payment.schema.js";
import { generateSubscriptionId } from "../subscriptions/utils.js";

const paymentRepository = new PaymentRepository();
const subscriptionRepository = new SubscriptionRepository();
const plansRepository = new PlansRepository();

export class PaymentService {
  async stkPush(params: StkPushParams, userId: string): Promise<RequestIds> {
    const { phoneNumber, planId } = params;

    const paymentId = randomUUID();
    const subscriptionId = randomUUID();
    const newSubscriptionId = generateSubscriptionId();

    // get plan details
    const plan = await plansRepository.getById(planId);

    if (!plan) {
      throw ApiError.badRequest("Plan not found");
    }

    // --------------------------------
    // 1. Create subscription + payment
    // --------------------------------

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

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

      console.log(plan);

      await paymentRepository.createPaymentRecord(
        {
          payment_id: paymentId,
          subscription_id: subscriptionId,
          amount: plan.amount,
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
      const result = await stkPush({
        accountReference: newSubscriptionId,
        amount: plan.amount,
        phoneNumber,
      });

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
