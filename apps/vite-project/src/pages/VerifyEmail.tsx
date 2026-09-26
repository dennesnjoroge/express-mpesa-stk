import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import apiClient from "../config/apiClient";
import axios from "axios";

export const VerifyEmail = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const ref = params.get("ref");
  const navigate = useNavigate();

  const isVerifying = useRef(false);

  useEffect(() => {
    if (!token || !ref) {
      navigate("/login", { replace: true });
      return;
    }

    if (isVerifying.current) return;
    isVerifying.current = true;

    const verifyEmail = async () => {
      try {
        const { data } = await apiClient.post("/auth/verify-email", {
          verificationToken: token,
          ref,
        });

        navigate("/email-verification-success", {
          replace: true,
          state: {
            message:
              data.message || "Your email has been verified successfully.",
          },
        });
      } catch (error) {
        let message = "An unexpected error happened. Try again later.";

        if (axios.isAxiosError(error)) {
          if (error.response) {
            message = error.response.data.message;
          } else if (error.request) {
            message = "Network error. Please check your internet connection.";
          } else {
            message =
              "Something went wrong while processing your request. Please try again later.";
          }
        }

        navigate("/email-verification-failed", {
          replace: true,
          state: { message },
        });
      }
    };

    verifyEmail();
  }, [token, ref, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 font-sans antialiased">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 md:p-12 shadow-sm">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img
              src="https://assets.loft.co.ke/images/loft-logo-main.svg"
              alt="Loft Logo"
              className="h-6 w-auto"
            />
          </div>

          {/* Icon / Status Indicator */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-neutral-300 border-t-slate-900"></div>
            </div>
          </div>

          {/* Heading & Description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Verifying your email
            </h1>

            <p className="mx-auto max-w-md text-slate-700">
              Please wait while we verify your email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
