"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Loader2, Sparkles, Search, ArrowRight, FileText } from "lucide-react";
import { useAuth } from "~/hooks/use-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PublicForm {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  createdAt: string;
  responseCount: number;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const [forms, setForms] = useState<PublicForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadForms = async () => {
      try {
        const res = await fetch(`${API_URL}/api/public/forms?limit=50&offset=0`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        setForms(Array.isArray(data) ? data : []);
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };
    loadForms();
  }, []);

  const filtered = forms.filter(
    (f) =>
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">FormFlow</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/pricing">
                <Button variant="ghost" size="sm">Pricing</Button>
              </Link>
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Explore Public Forms
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
            Discover forms created by the community
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search forms..."
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No forms found</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {search ? "Try a different search term" : "No public forms available yet"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((form) => (
              <Link
                key={form.id}
                href={`/forms/${form.slug}`}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
              >
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {form.title}
                </h3>
                {form.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {form.description}
                  </p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                  <div className="flex items-center gap-3">
                    <span>{form.responseCount || 0} responses</span>
                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
