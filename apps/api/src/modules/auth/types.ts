import { RowDataPacket } from "mysql2/promise";

export interface User extends RowDataPacket {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  password_hash: string;
  email_verified_at: Date | null;
  status: "PENDING_VERIFICATION" | "ACTIVE";
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserParams {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  password_hash?: string;
  status?: User["status"];
}
