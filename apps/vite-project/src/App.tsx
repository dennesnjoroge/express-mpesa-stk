import { BrowserRouter, Route, Routes } from "react-router";
import { ToastContainer } from "react-toastify";

import {
  AuthProvider,
  ProtectedRoute,
  PublicOnlyRoute,
} from "./context/AuthContext";
import { Checkout } from "./pages/Checkout";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Plans } from "./pages/Plans";
import { Register } from "./pages/Register";
import { VerificationEmailSent } from "./pages/VerificationEmailSent";
import { VerifyEmail } from "./pages/VerifyEmail";
import { EmailVerificationSuccess } from "./pages/EmailVerificationSuccess";
import { EmailVerificationFailed } from "./pages/EmailVerificationFailed";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer position="top-center" autoClose={2000} />
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/verification-email-sent"
            element={
              <PublicOnlyRoute>
                <VerificationEmailSent />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/verify-email"
            element={
              <PublicOnlyRoute>
                <VerifyEmail />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/email-verification-success"
            element={
              <PublicOnlyRoute>
                <EmailVerificationSuccess />
              </PublicOnlyRoute>
            }
          />

          <Route
            path="/email-verification-failed"
            element={
              <PublicOnlyRoute>
                <EmailVerificationFailed />
              </PublicOnlyRoute>
            }
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/plans"
            element={
              <ProtectedRoute>
                <Plans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:planId"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
