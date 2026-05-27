"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "~/hooks/use-auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoEmail] = useState("demo@formflow.dev");
  const [demoPassword] = useState("demo123456");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">FormFlow</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={fillDemo}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Use demo credentials
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
