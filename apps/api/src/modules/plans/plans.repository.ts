import type { RowDataPacket } from "mysql2";
import { pool } from "../../core/config/db.js";

interface Plan extends RowDataPacket {
  id: number;
  name: string;
  amount: number;
  duration_days: number;
  created_at: Date;
}

export class PlansRepository {
  async getById(planId: number): Promise<Plan | null> {
    const [rows] = await pool.execute<Plan[]>(
      `SELECT id, name, amount, duration_days, created_at FROM plans WHERE id = ?`,
      [planId],
    );

    return rows[0] ?? null;
  }

  async getAll() {
    const [rows] = await pool.execute("SELECT * FROM plans");

    return rows;
  }
}

export const plansRepository = new PlansRepository();
