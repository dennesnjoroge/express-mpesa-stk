import type { PoolConnection } from "mysql2/promise";

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

export class PaymentRepository {
  async createPaymentRecord(
    params: CreatePaymentRecordParams,
    connection: PoolConnection,
  ): Promise<void> {
    const { payment_id, subscription_id, amount, method } = params;

    await connection.execute(
      `INSERT INTO payments (payment_id, subscription_id, amount, method) VALUES (uuid_to_bin(?), uuid_to_bin(?), amount, method)`,
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
}
