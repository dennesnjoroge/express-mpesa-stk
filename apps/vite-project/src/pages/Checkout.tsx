import { type FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router";

const plans = [
  {
    id: 1,
    name: "Basic",
    amount: 100,
    duration_days: 30,
  },
  {
    id: 2,
    name: "Standard",
    amount: 250,
    duration_days: 30,
  },
  {
    id: 3,
    name: "Premium",
    amount: 500,
    duration_days: 30,
  },
];

export const Checkout = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const plan = plans.find((item) => item.id === Number(planId));

  if (!plan) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Plan not found
          </h1>

          <button
            type="button"
            onClick={() => navigate("/plans")}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to plans
          </button>
        </div>
      </main>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);

    try {
      console.log({
        plan_id: plan.id,
        phone_number: phoneNumber,
        amount: plan.amount,
      });

      // Call your STK Push API here.
      //
      // await api.post("/subscriptions", {
      //   plan_id: plan.id,
      //   phone_number: phoneNumber,
      // });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate("/plans")}
          className="mb-4 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to plans
        </button>

        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>

            <p className="mt-1 text-sm text-gray-500">
              Review your subscription and complete payment.
            </p>
          </div>

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Plan</span>

              <span className="text-sm font-medium text-gray-900">
                {plan.name}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Duration</span>

              <span className="text-sm font-medium text-gray-900">
                {plan.duration_days} days
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
              <span className="text-sm font-medium text-gray-700">Total</span>

              <span className="text-lg font-semibold text-gray-900">
                KES {plan.amount.toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="phone_number"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                M-Pesa phone number
              </label>

              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="0712345678"
                autoComplete="tel"
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                You will receive an M-Pesa payment prompt on this number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending payment prompt..." : "Pay with M-Pesa"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};
