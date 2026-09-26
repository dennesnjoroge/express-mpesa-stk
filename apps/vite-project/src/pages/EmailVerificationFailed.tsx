import { Link, useLocation } from "react-router";

export const EmailVerificationFailed = () => {
  const location = useLocation();

  const message = location.state?.message;

  return (
    <div className="mx-auto max-w-md text-center">
      <h2 className="text-lg font-semibold">Verification unsuccessful</h2>

      <p className="mt-2 text-gray-600">{message}</p>

      <div className="mt-6 flex items-center justify-center gap-4">
        <Link to="/login" replace className="underline">
          Sign in
        </Link>

        <Link to="/resend-verification" className="underline">
          Resend verification
        </Link>
      </div>
    </div>
  );
};
