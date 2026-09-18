import { PoolConnection } from "mysql2/promise";
import { Subscription, CreateSubscriptionRecord } from "./types.js";

const subscription_columns = `
  id,
  user_id,
  plan_id,
  start_at,
  expires_at,
  status,
  created_at,
  updated_at,
  active_user_id
`;

export class SubscriptionRepository {
  async expireExpiredSubscriptionByUserId(
    userId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE subscriptions set status = 'expired' WHERE user_id = uuid_to_bin(?)`,
      [userId],
    );
  }

  async getCurrentSubscriptionByUserId(
    userId: string,
    connection: PoolConnection,
  ): Promise<Subscription | null> {
    const [rows] = await connection.execute<Subscription[]>(
      `SELECT ${subscription_columns}
         FROM subscriptions
         WHERE user_id = uuid_to_bin(?)
           AND status = 'active'
           AND start_at <= UTC_TIMESTAMP()
           AND expires_at > UTC_TIMESTAMP()
         LIMIT 1`,
      [userId],
    );

    return rows[0] ?? null;
  }

  async createSubscriptionRecord(
    params: CreateSubscriptionRecord,
    connection: PoolConnection,
  ): Promise<void> {
    const { subscription_id, user_id, plan_id } = params;

    await connection.execute(
      `INSERT into subscriptions (subscription_id, user_id, plan_id) VALUES (uuid_to_bin(?), uuid_to_bin(?), ?)`,
      [subscription_id, user_id, plan_id],
    );
  }

  async markSubscriptionAsFailed(
    subscriptionId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE subscriptions SET status = 'failed' WHERE id = uuid_to_bin(?)`,
      [subscriptionId],
    );
  }
}
