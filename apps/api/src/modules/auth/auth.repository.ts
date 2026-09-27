import type { ResultSetHeader, PoolConnection, Pool } from "mysql2/promise";
import { pool } from "../../core/config/db.js";
import type {
  User,
  CreateUserParams,
  EmailVerificationToken,
  CreateVerificationTokenParams,
  CreatePasswordResetTokenParams,
  PasswordResetToken,
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

const EMAIL_VERIFICATION_TOKEN_COLUMNS = `
bin_to_uuid(id) AS id,
bin_to_uuid(user_id) AS user_id,
token_hash,
expires_at,
used_at,
created_at
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

  async updatePassword(
    passwordHash: string,
    userId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE users SET password_hash = ? WHERE id = UUID_TO_BIN(?)`,
      [passwordHash, userId],
    );
  }

  async getByEmailAddressNotVerified(
    emailAddress: string,
  ): Promise<User | null> {
    const [rows] = await pool.execute<User[]>(
      `SELECT ${USER_COLUMNS} FROM users WHERE email_address = ? AND status = 'PENDING_VERIFICATION' LIMIT 1`,
      [emailAddress],
    );

    return rows[0] ?? null;
  }

  async markUserAsVerified(
    userId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE users SET status = 'ACTIVE', email_verified_at = ? WHERE id = UUID_TO_BIN(?) AND status = 'PENDING_VERIFICATION' AND email_verified_at IS NULL`,
      [new Date(), userId],
    );
  }

  createVerificationToken = async (
    params: CreateVerificationTokenParams,
    connection: Pool | PoolConnection = pool,
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
    VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?)
    AS new
    ON DUPLICATE KEY UPDATE
      id = new.id,
      token_hash = new.token_hash,
      expires_at = new.expires_at
  `,
      [id, user_id, token_hash, expires_at],
    );
  };

  getVerificationTokenByUserId = async (
    userId: string,
  ): Promise<EmailVerificationToken | null> => {
    const [rows] = await pool.execute<EmailVerificationToken[]>(
      `SELECT ${EMAIL_VERIFICATION_TOKEN_COLUMNS} FROM email_verification_tokens WHERE user_id = uuid_to_bin(?)`,
      [userId],
    );

    return rows[0] ?? null;
  };

  getVerificationTokenById = async (
    id: string,
  ): Promise<EmailVerificationToken | null> => {
    const [rows] = await pool.execute<EmailVerificationToken[]>(
      `SELECT ${EMAIL_VERIFICATION_TOKEN_COLUMNS} FROM email_verification_tokens WHERE id = uuid_to_bin(?) AND expires_at > NOW() AND used_at IS NULL`,
      [id],
    );

    return rows[0] ?? null;
  };

  markVerificationTokenAsUsed = async (
    id: string,
    connection: PoolConnection,
  ) => {
    await connection.execute(
      `UPDATE email_verification_tokens SET used_at = ? WHERE id = UUID_TO_BIN(?) AND used_at IS NULL`,
      [new Date(), id],
    );
  };

  deleteUser = async (userId: string): Promise<void> => {
    await pool.execute(`DELETE FROM users WHERE id = UUID_TO_BIN(?)`, [userId]);
  };

  createPasswordResetToken = async (
    params: CreatePasswordResetTokenParams,
    connection: Pool | PoolConnection = pool,
  ): Promise<void> => {
    const { user_id, token_hash, expires_at } = params;

    await connection.execute(
      `INSERT INTO password_reset_tokens
      (user_id, token_hash, expires_at)
     VALUES (UUID_TO_BIN(?), ?, ?)`,
      [user_id, token_hash, expires_at],
    );
  };

  getPasswordResetTokenByHash = async (
    tokenHash: string,
  ): Promise<PasswordResetToken | null> => {
    const [rows] = await pool.execute<PasswordResetToken[]>(
      `SELECT
       id,
       BIN_TO_UUID(user_id) AS user_id,
       token_hash,
       expires_at,
       used_at,
       created_at
     FROM password_reset_tokens
     WHERE token_hash = ?
       AND used_at IS NULL
       AND expires_at > NOW()
     LIMIT 1`,
      [tokenHash],
    );

    return rows[0] ?? null;
  };

  markPasswordResetTokenAsUsed = async (
    id: bigint,
    connection: PoolConnection,
  ): Promise<void> => {
    await connection.execute(
      `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE id = ?
       AND used_at IS NULL`,
      [id],
    );
  };
}
