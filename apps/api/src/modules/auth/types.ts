import type { RowDataPacket } from "mysql2";

export interface User extends RowDataPacket {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone_number: string;
  password_hash: string;
  email_verified_at: Date | null;
  phone_verified_at: Date | null;
  status: "PENDING_VERIFICATION" | "ACTIVE";
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserParams {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  password_hash: string;
  status?: User["status"];
}

export interface EmailVerificationToken extends RowDataPacket {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export interface CreateVerificationTokenParams {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
}

export interface LoginParams {
  emailAddress: string;
  password: string;
}

export interface RegisterParams {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
}
