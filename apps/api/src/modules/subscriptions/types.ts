import type { RowDataPacket } from "mysql2/promise";

export interface Subscription extends RowDataPacket {
  id: string;
  user_id: string;
  plan_id: number;
  start_at: Date | null;
  expires_at: Date | null;
  status: "pending" | "active" | "failed" | "cancelled" | "expired";
  created_at: Date;
  updated_at: Date;
  active_user_id: string | null;
}

export interface CreateSubscriptionRecord {
  id: string;
  user_id: string;
  plan_id: number;
}

export interface MarkSubscriptionAsSuccessfulParams {
  id: string;
  start_at: Date;
  expires_at: Date;
}
