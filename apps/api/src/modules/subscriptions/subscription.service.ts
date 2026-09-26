import { ApiError } from "../../core/errors/api-error.js";
import { AuthRepository } from "../auth/auth.repository.js";
import { mailService } from "../mail/MailService.js";
import { plansRepository } from "../plans/plans.repository.js";
import { SubscriptionRepository } from "./subscription.repository.js";
import type { Subscription } from "./types.js";

const subscriptionRepository = new SubscriptionRepository();
const authRepository = new AuthRepository();

export class SubscriptionService {
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    return await subscriptionRepository.getCurrentSubscriptionByUserId(userId);
  }

  async cancelSubscription(
    subscriptionId: string,
    userId: string,
  ): Promise<void> {
    const user = await authRepository.getById(userId);

    if (!user) {
      throw new Error(`User with id ${userId} not found`); //internal
    }

    const subscription =
      await subscriptionRepository.getSubcriptionForCancellation(
        subscriptionId,
        userId,
      );

    if (!subscription) {
      throw ApiError.badRequest("You do not have an active subscription.");
    }

    if (!subscription.expires_at) {
      throw ApiError.badRequest("Subscription expiry date is missing.");
    }

    const plan = await plansRepository.getById(subscription.plan_id);

    if (!plan) {
      throw ApiError.badRequest("plan not found.");
    }

    await subscriptionRepository.markSubscriptionAsCancelled(subscriptionId);

    // send cancellation email
    mailService.sendSubscriptionCancelledEmail({
      lastName: user.last_name,
      email: user.email_address,
      subscriptionId: subscription.id,
      planName: plan.name,
      expiresAt: subscription.expires_at,
    });
  }
}

export const subscriptionService = new SubscriptionService();
