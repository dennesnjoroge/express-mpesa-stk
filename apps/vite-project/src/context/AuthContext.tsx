import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router";
import apiClient from "../config/apiClient";
import type { AxiosResponse } from "axios";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  createdAt: string;
  updatedAt: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  emailAddress: string;
  password: string;
};

export type ActiveSubscription = {
  id: string;
  user_id: string;
  plan_id: number;
  start_at: string | null;
  expires_at: string | null;
  status: "pending" | "active" | "failed" | "expired";
  created_at: string;
  updated_at: string;
  active_user_id: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  activeSubscription: ActiveSubscription | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubscriptionLoading: boolean;
  login: (emailAddress: string, password: string) => Promise<AxiosResponse>;
  register: (input: RegisterInput) => Promise<AxiosResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getActiveSubscription: () => Promise<ActiveSubscription | null>;
  setActiveSubscription: React.Dispatch<
    React.SetStateAction<ActiveSubscription | null>
  >;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeSubscription, setActiveSubscription] =
    useState<ActiveSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  const getActiveSubscription = useCallback(async () => {
    try {
      setIsSubscriptionLoading(true);
      const { data } = await apiClient.get<{
        subscription: ActiveSubscription | null;
      }>("/subscriptions");
      setActiveSubscription(data.subscription ?? null);
      return data.subscription ?? null;
    } catch {
      setActiveSubscription(null);
      return null;
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get<AuthUser>("/auth/me");
      setUser(data);
      await getActiveSubscription();
    } catch {
      setUser(null);
      setActiveSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [getActiveSubscription]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (emailAddress: string, password: string) => {
      const response = await apiClient.post("/auth/login", {
        emailAddress,
        password,
      });

      await refreshUser();

      return response;
    },
    [refreshUser],
  );

  const register = useCallback(async (input: RegisterInput) => {
    const response = await apiClient.post("/auth/register", input);

    return response;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
      setActiveSubscription(null);
      setIsLoading(false);
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await apiClient.post("/auth/delete");
    } finally {
      setUser(null);
      setActiveSubscription(null);
      setIsLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    activeSubscription,
    setActiveSubscription,
    isAuthenticated: !!user,
    isLoading,
    isSubscriptionLoading,
    login,
    register,
    logout,
    refreshUser,
    getActiveSubscription,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Checking session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
