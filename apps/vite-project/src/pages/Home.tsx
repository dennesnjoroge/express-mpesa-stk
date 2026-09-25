import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import apiClient from "../config/apiClient";
import { toast } from "react-toastify";

export const Home = () => {
  const navigate = useNavigate();
  const {
    user,
    logout,
    activeSubscription,
    setActiveSubscription,
    isSubscriptionLoading,
  } = useAuth();

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);

  const planNameMap: Record<number, string> = {
    1: "Basic",
    2: "Standard",
    3: "Premium",
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      toast.success("Successfully signed out.");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      console.log("Deleting account...");

      // await api.delete("/account");

      toast.success("Account deleted.");

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Failed to delete account:", error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCancellingSubscription(true);

    if (!activeSubscription?.id) {
      return;
    }

    try {
      setCancellingSubscription(true);

      await apiClient.post("/subscriptions/cancel", {
        subscriptionId: activeSubscription.id,
      });

      toast.success("Subscription cancelled successfully");

      setActiveSubscription(null);
    } finally {
      setCancellingSubscription(false);
    }
  };

  const subscriptionPlan = activeSubscription
    ? (planNameMap[activeSubscription.plan_id] ?? "Custom")
    : null;

  const subscriptionExpiresAt = activeSubscription?.expires_at
    ? new Date(activeSubscription.expires_at).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Welcome, {user?.firstName ?? "User"}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your account and subscription.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loggingOut ? "Signing out..." : "Sign out"}
          </button>
        </header>

        {/* Navigation */}
        <nav className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">
            Account overview
          </h2>

          <Link
            to="/plans"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View plans
          </Link>
        </nav>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Account
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">
                  {user?.emailAddress ?? "--"}
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900">
                Delete account
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Permanently delete your account and associated data. This action
                cannot be undone.
              </p>

              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(true)}
                className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete account
              </button>
            </div>
          </section>

          {/* Subscription */}
          <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Subscription
            </h2>

            {isSubscriptionLoading ? (
              <div className="py-4">
                <p className="text-sm text-gray-500">Loading subscription...</p>
              </div>
            ) : activeSubscription ? (
              <>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Plan</p>
                    <p className="font-medium text-gray-900">
                      {subscriptionPlan}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-green-600">
                      {activeSubscription.status.charAt(0).toUpperCase() +
                        activeSubscription.status.slice(1).toLowerCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Expires</p>
                    <p className="font-medium text-gray-900">
                      {subscriptionExpiresAt}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    to="/plans"
                    className="block w-full rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Change plan
                  </Link>

                  <button
                    type="button"
                    onClick={handleCancelSubscription}
                    className="flex w-full items-center justify-center gap-2 rounded-md border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    {cancellingSubscription && (
                      <span
                        className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                        role="status"
                        aria-label="Processing subscription cancellation"
                      />
                    )}
                    {cancellingSubscription
                      ? "Cancelling subscription"
                      : "Cancel subscription"}
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-md border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-base font-medium text-gray-900">
                  No active subscription
                </h3>

                <p className="mt-1 text-sm leading-5 text-gray-500">
                  You don't currently have an active subscription.
                </p>

                <Link
                  to="/plans"
                  className="mt-5 block w-full rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Purchase a plan
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900">
              Delete account?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This will permanently delete your account and associated data.
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={deleting}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
