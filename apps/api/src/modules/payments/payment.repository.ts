import type { Pool, PoolConnection } from "mysql2/promise";
import { pool } from "../../core/config/db.js";
import type { Payment } from "./types.js";

interface CreatePaymentRecordParams {
  payment_id: string;
  subscription_id: string;
  amount: number;
  method: string;
}

interface UpdatePaymentRequestId {
  paymentId: string;
  checkoutRequestId: string;
  merchantRequestId: string;
}

const paymentColumns = `payment_id,
  subscription_id,
  amount,
  method,
  status,
  checkout_request_id,
  merchant_request_id,
  mpesa_receipt_number,
  created_at,
  paid_at`;

export class PaymentRepository {
  async createPaymentRecord(
    params: CreatePaymentRecordParams,
    connection: PoolConnection,
  ): Promise<void> {
    const { payment_id, subscription_id, amount, method } = params;

    await connection.execute(
      `INSERT INTO payments (payment_id, subscription_id, amount, method) VALUES (uuid_to_bin(?), ?, amount, method)`,
      [payment_id, subscription_id, Number(amount), method],
    );
  }

  async updatePaymentRequestId(
    params: UpdatePaymentRequestId,
    connection: PoolConnection,
  ): Promise<void> {
    const { paymentId, checkoutRequestId, merchantRequestId } = params;

    await connection.execute(
      `UPDATE payments SET checkout_request_id = ?, merchant_request_id = ? WHERE payment_id = uuid_to_bin(?)`,
      [checkoutRequestId, merchantRequestId, paymentId],
    );
  }

  async markPaymentAsFailed(
    paymentId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE payments SET status = 'failed' WHERE payment_id = uuid_to_bin(?)`,
      [paymentId],
    );
  }

  async getPaymentRecordByCheckoutRequestId(
    checkoutRequestId: string,
    connection: Pool | PoolConnection = pool,
  ): Promise<Payment | null> {
    const [rows] = await connection.execute<Payment[]>(
      `SELECT ${paymentColumns} FROM payments WHERE checkout_request_id = ? FOR UPDATE`,
      [checkoutRequestId],
    );

    return rows[0] ?? null;
  }

  async markPaymentAsCancelled(
    checkoutRequestId: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE payments SET status = 'cancelled' WHERE checkout_request_id = ?`,
      [checkoutRequestId],
    );
  }

  async markPaymentAsSuccessful(
    checkout_request_id: string,
    mpesa_receipt_number: string,
    connection: PoolConnection,
  ): Promise<void> {
    await connection.execute(
      `UPDATE payments SET status = 'success', mpesa_receipt_number = ? WHERE checkout_request_id = ?`,
      [mpesa_receipt_number, checkout_request_id],
    );
  }
}
