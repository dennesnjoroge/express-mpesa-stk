import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import apiClient from "../config/apiClient";
import axios from "axios";
import { toast } from "react-toastify";
import type { ActiveSubscription } from "../context/AuthContext";

type Plan = {
  id: number;
  name: string;
  amount: number;
  duration_days: number;
};

type PaymentStatusResponse =
  | {
      status: "success";
      subscription: ActiveSubscription;
    }
  | {
      status: "pending" | "failed" | "cancelled" | "reversed" | "timeout";
    };

export const Checkout = () => {
  const { planId } = useParams();
  const navigate = useNavigate();

  const { setActiveSubscription } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  //const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await apiClient.get<Plan[]>("/plans");
        setPlans(data);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setLoadingPlans(false);
      }
    };

    void fetchPlans();
  }, []);

  const plan = plans.find((item) => item.id === Number(planId));

  if (loadingPlans) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center text-sm text-gray-500">
          Loading plan details...
        </div>
      </main>
    );
  }

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

    if (!phoneNumber) {
      setError("Phone number is required.");
      return;
    }

    const checkPaymentStatus = async (checkoutRequestId: string) => {
      const response = await apiClient.get("/payments/status", {
        params: {
          checkoutRequestId,
        },
      });

      return response.data;
    };

    const pollPaymentStatus = async (
      checkoutRequestId: string,
      attempts = 60,
    ): Promise<PaymentStatusResponse> => {
      for (let i = 0; i < attempts; i++) {
        const paymentStatus = await checkPaymentStatus(checkoutRequestId);

        if (paymentStatus.status !== "pending") {
          return paymentStatus;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return {
        status: "timeout",
      };
    };

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const { data } = await apiClient.post("/payments/stk-push", {
        planId: plan.id,
        phoneNumber,
      });

      const checkoutRequestId = data?.CheckoutRequestID;

      if (!checkoutRequestId) {
        throw new Error("Payment request could not be initialized.");
      }

      //setCheckoutRequestId(checkoutRequestId);

      setSuccess(
        data.message || "Success. Check your phone and enter your M-Pesa PIN.",
      );

      setLoading(false);

      setWaitingPayment(true);

      const paymentStatus = await pollPaymentStatus(checkoutRequestId);

      // 3. Handle result
      if (paymentStatus.status === "success") {
        const subscription = paymentStatus.subscription;

        if (!subscription) {
          toast.error("Payment succeeded but subscription data is missing.");
          return;
        }

        setSuccess(
          `Payment successful! Subscription ID: ${paymentStatus.subscription.id}. Redirecting...`,
        );

        const normalizedSubscription: ActiveSubscription = {
          id: subscription.id,
          user_id: subscription.user_id ?? "",
          plan_id: subscription.plan_id ?? "",
          status: subscription.status ?? "active",
          start_at: subscription.start_at ?? null,
          expires_at: subscription.expires_at ?? null,
          created_at: subscription.created_at ?? new Date().toISOString(),
          updated_at: subscription.updated_at ?? new Date().toISOString(),
          active_user_id: subscription.active_user_id ?? null,
        };

        setActiveSubscription(normalizedSubscription);

        setTimeout(() => {
          navigate("/", {
            replace: true,
          });
        }, 3000);
      } else if (paymentStatus.status === "failed") {
        setSuccess("");
        setError("We couldn’t complete your payment. Please try again.");
      } else if (paymentStatus.status === "cancelled") {
        setSuccess("");

        setError(
          "Payment cancelled. The M-Pesa payment request was cancelled.",
        );
      } else if (paymentStatus.status === "timeout") {
        setSuccess("");

        setError(
          "We have not received payment confirmation yet. Please check your M-Pesa messages.",
        );
      }
    } catch (error) {
      setSuccess("");
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const { data } = error.response;
          setError(data.message ?? "Unable to initiate payment.");
        } else if (error.request) {
          setError("Unable to reach the server. Please try again.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
      setWaitingPayment(false);
    }
  };

  /*
  const handleCancelPayment = (checkoutRequestId: string) => {
    console.log(checkoutRequestId);
    setSuccess("Payment has been cancelled.");
    setLoading(false);
    setWaitingPayment(false);
  };
  */

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
                KES {Number(plan.amount).toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {success && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {success}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

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
                maxLength={10}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                You will receive an M-Pesa payment prompt on this number.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || waitingPayment}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(loading || waitingPayment) && (
                <span
                  className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  role="status"
                  aria-label="Processing payment transaction"
                />
              )}

              <span>
                {loading && "Initiating M-Pesa..."}
                {!loading && waitingPayment && "Waiting for payment..."}
                {!loading && !waitingPayment && "Pay with M-Pesa"}
              </span>
            </button>

            {/**
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * //cancel payment button. no api logic
 * {waitingPayment && (
              <button
                type="button"
                className="underline"
                onClick={() => handleCancelPayment(checkoutRequestId)}
              >
                Cancel payment
              </button>
            )}
 */}
          </form>
        </div>
      </div>
    </main>
  );
};
