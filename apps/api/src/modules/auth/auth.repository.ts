import type { ResultSetHeader, PoolConnection, Pool } from "mysql2/promise";
import { pool } from "../../core/config/db.js";
import type {
  User,
  CreateUserParams,
  EmailVerificationToken,
  CreateVerificationTokenParams,
} from "./types.js";

const USER_COLUMNS = `
  bin_to_uuid(id) AS id,
  first_name,
  last_name,
  email_address,
  password_hash,
  email_verified_at,
  status,
  created_at,
  updated_at
`;

export class AuthRepository {
  async createUser(
    params: CreateUserParams,
    connection: PoolConnection,
  ): Promise<void> {
    const {
      id,
      first_name,
      last_name,
      email_address,
      password_hash = null,
      status = "PENDING_VERIFICATION",
    } = params;

    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO users (
          id,
          first_name,
          last_name,
          email_address,
          password_hash,
          status
        )
        VALUES (uuid_to_bin(?), ?, ?, ?, ?, ?)
      `,
      [id, first_name, last_name, email_address, password_hash, status],
    );
  }

  async getById(
    id: string,
    connection: Pool | PoolConnection = pool,
  ): Promise<User | null> {
    const [rows] = await connection.execute<User[]>(
      `SELECT ${USER_COLUMNS}
       FROM users
       WHERE id = uuid_to_bin(?)
       LIMIT 1`,
      [id],
    );

    return rows[0] ?? null;
  }

  async getByUserId(userId: string): Promise<User | null> {
    const [rows] = await pool.execute<User[]>(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = uuid_to_bin(?) LIMIT 1`,
      [userId],
    );

    return rows[0] ?? null;
  }

  async getByEmailAddress(emailAddress: string): Promise<User | null> {
    const [rows] = await pool.execute<User[]>(
      `SELECT ${USER_COLUMNS} FROM users WHERE email_address = ? LIMIT 1`,
      [emailAddress],
    );

    return rows[0] ?? null;
  }

  createVerificationToken = async (
    params: CreateVerificationTokenParams,
    connection: PoolConnection,
  ): Promise<void> => {
    const { id, user_id, token_hash, expires_at } = params;

    await connection.execute<ResultSetHeader>(
      `
        INSERT INTO email_verification_tokens (
          id,
          user_id,
          token_hash,
          expires_at
        )
        VALUES (uuid_to_bin(?), uuid_to_bin(?), ?, ?)
      `,
      [id, user_id, token_hash, expires_at],
    );
  };
}
