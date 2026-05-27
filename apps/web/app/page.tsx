"use client";

import Link from "next/link";
import { useAuth } from "~/hooks/use-auth";
import { ArrowRight, BarChart3, Globe, Lock, Palette, Share2, Sparkles, Zap } from "lucide-react";
import { Button } from "~/components/ui/button";

export default function LandingPage() {
  const { user } = useAuth();

  const features = [
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Beautiful Themes",
      description: "Customize your forms with stunning themes - from dark mode to neon, sunset to ocean.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Dynamic Fields",
      description: "Add text, email, number, select, rating, date fields with full validation controls.",
    },
    {
      icon: <Share2 className="h-6 w-6" />,
      title: "Share Instantly",
      description: "Public or unlisted forms with direct links. Share via QR code, email, or social media.",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Rich Analytics",
      description: "Track responses, view charts, export CSV data, and gain insights from your forms.",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Explore & Discover",
      description: "Browse public forms in the explore section. Get inspired by community templates.",
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Privacy Controls",
      description: "Public, unlisted, and password-protected forms. Full control over who sees your data.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">FormFlow</span>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/explore" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Explore
              </Link>
              <Link href="/pricing" className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                Pricing
              </Link>
              {user ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28 lg:py-36">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 mb-8">
            <Sparkles className="h-4 w-4" />
            Powered by tRPC, Drizzle ORM & Turborepo
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl">
            Build Beautiful
            <span className="block text-indigo-600 dark:text-indigo-400">Forms in Minutes</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Create dynamic forms with drag-and-drop fields, stunning themes, and powerful analytics.
            Share publicly or keep them unlisted. Collect responses without requiring logins.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    Get Started Free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button size="lg" variant="outline">
                    Explore Forms
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Everything you need to collect data
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            From simple polls to complex surveys - FormFlow handles it all.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 transition-all hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800"
            >
              <div className="mb-4 inline-flex rounded-lg bg-indigo-50 dark:bg-indigo-950/50 p-3 text-indigo-600 dark:text-indigo-400">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-16 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to create your first form?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
            Join thousands of creators building beautiful forms. No credit card required.
          </p>
          <div className="mt-8">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Get Started Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span className="font-semibold text-slate-900 dark:text-white">FormFlow</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Built with tRPC, Drizzle ORM & Turborepo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
