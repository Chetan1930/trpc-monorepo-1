"use client";

import Link from "next/link";
import { useAuth } from "~/hooks/use-auth";
import { Button } from "~/components/ui/button";
import { Sparkles, Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Up to 5 forms",
      "100 responses per month",
      "Basic field types",
      "Public & unlisted forms",
      "Basic analytics",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    description: "For creators and professionals",
    features: [
      "Unlimited forms",
      "10,000 responses per month",
      "All field types including rating & date",
      "Conditional logic",
      "Advanced analytics & charts",
      "CSV export",
      "Custom themes",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$49",
    description: "For teams and organizations",
    features: [
      "Everything in Pro",
      "Unlimited responses",
      "Team collaboration",
      "Custom domains",
      "API access",
      "SSO integration",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  const { user } = useAuth();

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
              <Link href="/explore">
                <Button variant="ghost" size="sm">Explore</Button>
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the plan that fits your needs. No hidden fees. Upgrade or downgrade anytime.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-indigo-500 bg-white dark:bg-slate-900 shadow-xl scale-105"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-slate-500">/month</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={user ? "/dashboard" : "/register"}>
                <Button
                  className={`w-full mt-8 gap-2 ${
                    plan.popular ? "" : "variant-outline"
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
