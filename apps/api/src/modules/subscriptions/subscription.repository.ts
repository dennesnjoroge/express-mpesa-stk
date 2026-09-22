import type { PoolConnection, Pool } from "mysql2/promise";
import type {
  Subscription,
  CreateSubscriptionRecord,
  MarkSubscriptionAsSuccessfulParams,
} from "./types.js";
import { pool } from "../../core/config/db.js";

const subscription_columns = `
  id,
  bin_to_uuid(user_id) AS user_id,
  plan_id,
  start_at,
  expires_at,
  status,
  created_at,
  updated_at,
  bin_to_uuid(active_user_id) AS active_user_id 
`;

export class SubscriptionRepository {
  async expireExpiredSubscriptionByUserId(
    userId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `
      UPDATE subscriptions
      SET status = 'expired'
      WHERE user_id = UUID_TO_BIN(?)
        AND status = 'active'
        AND expires_at <= UTC_TIMESTAMP()
    `,
      [userId],
    );
  }

  async getCurrentSubscriptionByUserId(
    userId: string,
    connection: Pool | PoolConnection = pool,
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
      `INSERT into subscriptions (id, user_id, plan_id) VALUES (?, uuid_to_bin(?), ?)`,
      [subscription_id, user_id, plan_id],
    );
  }

  async markSubscriptionAsFailed(
    subscriptionId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE subscriptions SET status = 'failed' WHERE id = ?`,
      [subscriptionId],
    );
  }

  async getSubscriptionBySubscriptionId(
    subscriptionId: string,
    connection: Pool | PoolConnection = pool,
  ): Promise<Subscription | null> {
    const [rows] = await connection.execute<Subscription[]>(
      `SELECT ${subscription_columns} FROM subscriptions WHERE id = ? FOR UPDATE`,
      [subscriptionId],
    );

    return rows[0] ?? null;
  }

  async markSubscriptionAsSuccessful(
    params: MarkSubscriptionAsSuccessfulParams,
    connection: PoolConnection,
  ): Promise<void> {
    const { subscription_id, start_at, expires_at } = params;

    await connection.execute(
      `UPDATE subscriptions SET status = 'active', start_at = ?, expires_at = ? WHERE id = ?`,
      [start_at, expires_at, subscription_id],
    );
  }

  async markSubscriptionAsCancelled(subscriptionId: string): Promise<void> {
    await pool.execute(
      `UPDATE TABLE subscriptions SET status = 'cancelled' WHERE id = ?`,
      [subscriptionId],
    );
  }
}
