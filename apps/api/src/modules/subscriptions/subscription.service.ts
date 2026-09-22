import { SubscriptionRepository } from "./subscription.repository.js";
import type { Subscription } from "./types.js";

const subscriptionRepository = new SubscriptionRepository();

export class SubscriptionService {
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    return await subscriptionRepository.getCurrentSubscriptionByUserId(userId);
  }
}

export const subscriptionService = new SubscriptionService();
