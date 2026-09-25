import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import apiClient from "../config/apiClient";

type Plan = {
  id: number;
  name: string;
  amount: number;
  duration_days: number;
};

export const Plans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await apiClient.get<Plan[]>("/plans");
        setPlans(data);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchPlans();
  }, []);

  const handleSubscribe = (planId: number) => {
    navigate(`/checkout/${planId}`);
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          ← Back to home
        </button>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Choose a plan
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Select a subscription plan to continue.
          </p>
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading plans...
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <section
                key={plan.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h2>

                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">
                    KES {Number(plan.amount).toFixed(2)}
                  </span>

                  <span className="ml-1 text-sm text-gray-500">
                    / {plan.duration_days} days
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubscribe(plan.id)}
                  className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Subscribe
                </button>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
