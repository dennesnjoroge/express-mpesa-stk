import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import apiClient from "../config/apiClient";
import { Mail } from "lucide-react";

export const VerificationEmailSent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailAddress = searchParams.get("email") ?? "your email address";

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    if (!searchParams.get("email")) {
      setResent(true);
      return;
    }

    setResending(true);
    setResent(false);

    try {
      await apiClient.post("/auth/resend-verification", {
        emailAddress,
      });

      setResent(true);
    } catch (error) {
      console.error("Failed to resend verification email:", error);
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <Mail className="text-blue-600 h-6 w-6" />
        </div>

        <div className="mt-5">
          <h1 className="text-2xl font-semibold text-gray-900">
            Check your email
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            We sent a verification link to{" "}
            <span className="font-medium text-gray-700">{emailAddress}</span>.
          </p>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Click the link in the email to verify your account. The link will
            expire after 30 minutes.
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending && (
              <span
                className="size-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                role="status"
                aria-label="Processing registration"
              />
            )}
            {resending ? "Sending..." : "Resend verification email"}
          </button>

          {resent && (
            <p className="mt-3 text-sm text-green-600">
              A new verification email has been sent.
            </p>
          )}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Already verified?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            Sign in
          </button>
        </p>
      </div>
    </main>
  );
};
