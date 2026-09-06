import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as Auth from "@/lib/_core/auth";
import { getApiBaseUrl } from "@/constants/oauth";

// ── Types ───────────────────────────────────────────────────────────

export type AuthUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  wardId: number | null;
  wardName: string | null;
  role?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    wardId: number;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── API helpers ─────────────────────────────────────────────────────

function apiBase(): string {
  return getApiBaseUrl().replace(/\/$/, "");
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${apiBase()}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

async function apiGet<T>(path: string, token?: string): Promise<T> {
  const url = `${apiBase()}${path}`;
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    headers,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

// ── Provider ────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = Boolean(user);

  // Check for existing session on mount
  useEffect(() => {
    (async () => {
      try {
        // Native: check SecureStore for cached token
        const token = await Auth.getSessionToken();
        if (token) {
          const data = await apiGet<{ user: AuthUser }>("/api/auth/me", token);
          if (data.user) {
            setUser(data.user);
            await Auth.setUserInfo(data.user as any);
          } else {
            await Auth.removeSessionToken();
          }
        } else {
          // Web: try cookie-based auth
          try {
            const data = await apiGet<{ user: AuthUser }>("/api/auth/me");
            if (data.user) {
              setUser(data.user);
              await Auth.setUserInfo(data.user as any);
            }
          } catch {
            // Not authenticated — expected
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      try {
        const data = await apiPost<{
          token: string;
          user: AuthUser;
        }>("/api/auth/login", { email, password });

        await Auth.setSessionToken(data.token);
        await Auth.setUserInfo(data.user as any);
        setUser(data.user);
        return {};
      } catch (err) {
        const message = err instanceof Error ? err.message : "Login failed";
        return { error: message };
      }
    },
    [],
  );

  const register = useCallback(
    async (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      wardId: number;
    }): Promise<{ error?: string }> => {
      try {
        const result = await apiPost<{
          token: string;
          user: AuthUser;
        }>("/api/auth/register", data);

        await Auth.setSessionToken(result.token);
        await Auth.setUserInfo(result.user as any);
        setUser(result.user);
        return {};
      } catch (err) {
        const message = err instanceof Error ? err.message : "Registration failed";
        return { error: message };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiPost("/api/auth/logout", {});
    } catch {
      // Continue with local logout even if API fails
    }
    await Auth.removeSessionToken();
    await Auth.clearUserInfo();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const token = await Auth.getSessionToken();
      if (token) {
        const data = await apiGet<{ user: AuthUser }>("/api/auth/me", token);
        if (data.user) {
          setUser(data.user);
          await Auth.setUserInfo(data.user as any);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, register, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return ctx;
}
