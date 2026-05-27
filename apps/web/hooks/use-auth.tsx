"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("formbuilder_token");
}

function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("formbuilder_token", token);
  } else {
    localStorage.removeItem("formbuilder_token");
  }
}

async function fetchApi(path: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || error[0]?.message || "Request failed");
  }

  return res.json();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setToken(storedToken);

    try {
      const result = await fetchApi("/auth/me");
      setUser(result);
    } catch {
      setStoredToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const result = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setStoredToken(result.token);
    setToken(result.token);
    setUser(result.user);
    toast.success("Logged in successfully!");
    router.push("/dashboard");
  };

  const register = async (fullName: string, email: string, password: string) => {
    const result = await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullName, email, password }),
    });

    setStoredToken(result.token);
    setToken(result.token);
    setUser(result.user);
    toast.success("Account created successfully!");
    router.push("/dashboard");
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    router.push("/");
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
