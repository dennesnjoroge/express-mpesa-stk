import { type FormEvent, useState } from "react";
import apiClient from "../config/apiClient";
import axios from "axios";

export const ForgotPassword = () => {
  const [emailAddress, setEmailAddress] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!emailAddress) {
      setSuccess("");
      setError("Email address is required.");
      return;
    }

    if (!emailRegex.test(emailAddress)) {
      setSuccess("");
      setError("Invalid email address.");
      return;
    }

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const { data } = await apiClient.post("/auth/forgot-password", {
        emailAddress,
      });

      setSuccess(
        data.message ||
          "Password reset instructions has been sent to your email.",
      );

      setEmailAddress("");
    } catch (error) {
      setSuccess("");
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const { data } = error.response;
          setError(
            data.message ||
              "Something went wrong while processing your request. Please try again in a few moments.",
          );
        } else if (error.request) {
          setError("Network error. Please check your internet connection.");
        } else {
          setError(
            "Something went wrong while processing your request. Please try again in a few moments.",
          );
        }
      } else {
        setError(
          "Something went wrong while processing your request. Please try again in a few moments.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Forgot your password?
          </h1>

          <p className="mt-1 text-sm leading-6 text-gray-500">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              htmlFor="email_address"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            <input
              id="email_address"
              name="email_address"
              type="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              autoComplete="email"
              maxLength={50}
              className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 active:bg-blue-800"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}
          <a
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
};
