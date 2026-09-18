import { RowDataPacket } from "mysql2/promise";

export interface Subscription extends RowDataPacket {
  subscription_id: string;
  user_id: string;
  plan_id: number;
  start_at: Date | null;
  expires_at: Date | null;
  status: "pending" | "active" | "failed" | "expired";
  created_at: Date;
  updated_at: Date;
  active_user_id: string | null;
}

export interface CreateSubscriptionRecord {
  subscription_id: string;
  user_id: string;
  plan_id: number;
}
