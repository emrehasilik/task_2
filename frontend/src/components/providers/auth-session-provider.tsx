"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { User } from "@/types/api";

export type AuthSessionStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "unavailable";

type AuthSessionContextValue = {
  refresh: () => Promise<void>;
  status: AuthSessionStatus;
  user: User | null;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthSessionStatus>("loading");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (response.ok) {
        setUser((await response.json()) as User);
        setStatus("authenticated");
        return;
      }

      setUser(null);
      setStatus(response.status === 401 ? "unauthenticated" : "unavailable");
    } catch {
      setUser(null);
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refresh(), 0);
    const handleAuthChange = () => void refresh();
    window.addEventListener("localcart:auth-changed", handleAuthChange);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("localcart:auth-changed", handleAuthChange);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ refresh, status, user }),
    [refresh, status, user],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession() {
  const value = useContext(AuthSessionContext);
  if (!value) {
    throw new Error("useAuthSession must be used inside AuthSessionProvider.");
  }
  return value;
}
