import { ResultSetHeader, PoolConnection, Pool } from "mysql2/promise";
import { pool } from "../../core/config/db.js";
import { User, CreateUserParams } from "./types.js";

const USER_COLUMNS = `
  id,
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
       WHERE id = uud_to_bin(?)
       LIMIT 1`,
      [id],
    );

    return rows[0] ?? null;
  }
}
