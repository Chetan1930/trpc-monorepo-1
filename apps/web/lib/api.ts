const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("formbuilder_token");
}

export async function apiFetch(path: string, options: RequestInit = {}) {
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
