"use client";

import { useEffect, useState, use, useCallback } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  Star,
  ChevronDown,
  AlertCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Field {
  id: string;
  type: string;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  order: number;
  options: string[];
  validation: Record<string, any> | null;
  showIf: Record<string, any> | null;
}

interface Theme {
  config: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: string;
    buttonStyle: string;
    logoUrl?: string;
  };
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: string;
  fields: Field[];
  theme: Theme | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check localStorage after hydration to avoid SSR mismatch
  useEffect(() => {
    const alreadySubmitted = localStorage.getItem(`formflow_submitted_${slug}`) === "true";
    if (alreadySubmitted) {
      setSubmitted(true);
    }
  }, [slug]);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [startTime] = useState(Date.now());
  const [respondentEmail, setRespondentEmail] = useState("");
  const [respondentName, setRespondentName] = useState("");
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const loadForm = async () => {
      try {
        const res = await fetch(`${API_URL}/api/forms/public/${slug}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const err = await res.json();
          if (res.status === 404) {
            throw new Error("This form doesn't exist or has been removed.");
          } else if (res.status === 410) {
            throw new Error("This form has expired and is no longer accepting responses.");
          } else if (res.status === 403) {
            throw new Error("This form is not currently accepting responses.");
          }
          throw new Error(err.message || "Form not found");
        }
        const data = await res.json();
        setForm(data);
      } catch (err: any) {
        setError(err.message || "Form not found");
        setErrorDetails(err.stack || null);
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [slug]);

  // Update progress when responses change
  useEffect(() => {
    if (!form) return;
    const requiredFields = form.fields.filter((f) => f.required);
    if (requiredFields.length === 0) {
      setProgress(100);
      return;
    }
    const filledCount = requiredFields.filter((f) => {
      const val = responses[f.id];
      if (Array.isArray(val)) return val.length > 0;
      return val !== undefined && val !== null && val !== "";
    }).length;
    setProgress(Math.round((filledCount / requiredFields.length) * 100));
  }, [responses, form]);

  // Fire confetti on submission
  const fireConfetti = useCallback(async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#6366f1", "#8b5cf6", "#ec4899"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#f97316", "#22c55e", "#0ea5e9"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch {
      // Confetti not critical
    }
  }, []);

  // Evaluate conditional logic
  const shouldShowField = (field: Field): boolean => {
    if (!field.showIf) return true;
    const entries = Object.entries(field.showIf);
    if (entries.length === 0) return true;

    // showIf format: { "fieldId": "expectedValue" } or { "fieldId": ["val1", "val2"] }
    for (const [fieldId, condition] of entries) {
      const currentValue = responses[fieldId];
      if (Array.isArray(condition)) {
        if (!condition.includes(currentValue)) return false;
      } else {
        if (currentValue !== condition) return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    // Validate required fields (only visible ones)
    const visibleFields = form.fields.filter(shouldShowField);
    for (const field of visibleFields) {
      if (field.required) {
        const val = responses[field.id];
        if (Array.isArray(val) && val.length === 0) {
          toast.error(`${field.label} is required`);
          return;
        }
        if (!Array.isArray(val) && (val === undefined || val === null || val === "")) {
          toast.error(`${field.label} is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId: form.id,
          formData: responses,
          respondentEmail: respondentEmail || undefined,
          respondentName: respondentName || undefined,
          timeToComplete: Math.floor((Date.now() - startTime) / 1000),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        if (res.status === 429) {
          throw new Error("Too many submissions. Please try again later.");
        } else if (res.status === 410) {
          throw new Error("This form has expired or the response limit has been reached.");
        }
        throw new Error(err.message || "Submission failed");
      }

      setSubmitted(true);
      localStorage.setItem(`formflow_submitted_${slug}`, "true");
      toast.success("Response submitted successfully!");
      fireConfetti();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const theme = form?.theme?.config;
  const primaryColor = theme?.primaryColor || "#6366f1";
  const bgColor = theme?.backgroundColor || "#ffffff";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor }}>
        <div className="text-center">
          <div className="relative mx-auto h-12 w-12 mb-4">
            <div
              className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin"
              style={{ borderColor: `${primaryColor}30`, borderTopColor: primaryColor }}
            />
            <Sparkles className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: primaryColor }} />
          </div>
          <p className="text-sm" style={{ color: theme?.textColor || "#64748b" }}>Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center max-w-md px-4">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 mb-6">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Form Not Available</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <Button onClick={() => window.location.href = "/"}>Go Home</Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Decorative background elements */}
        <div
          className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-5 -translate-x-1/2 -translate-y-1/2"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-5 translate-x-1/3 translate-y-1/3"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="text-center max-w-md px-4 relative z-10">
          <div
            className="inline-flex items-center justify-center h-20 w-20 rounded-full mb-6"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <CheckCircle2 className="h-10 w-10" style={{ color: primaryColor }} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: theme?.textColor || "#1a1a2e" }}>
            Thank You!
          </h1>
          <p className="mb-1" style={{ color: theme?.textColor || "#64748b" }}>
            Your response has been submitted successfully.
          </p>
          <p className="text-sm mb-8" style={{ color: theme?.textColor || "#94a3b8", opacity: 0.7 }}>
            We appreciate your time and feedback.
          </p>

          <div className="flex flex-col items-center gap-3">
            <div
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-full"
              style={{ backgroundColor: `${primaryColor}10`, color: primaryColor }}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>
                Completed in {Math.floor((Date.now() - startTime) / 1000)} seconds
              </span>
            </div>
            {form?.slug && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem(`formflow_submitted_${form.slug}`);
                  window.location.href = `/forms/${form.slug}`;
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Submit Another Response
              </Button>
            )}
          </div>
        </div>


      </div>
    );
  }

  if (!form) return null;

  const sortedFields = form.fields.sort((a, b) => a.order - b.order);
  const visibleFields = sortedFields.filter(shouldShowField);

  return (
    <div className="min-h-screen py-12 px-4 transition-colors duration-300" style={{ backgroundColor: bgColor }}>
      <div className="mx-auto max-w-2xl">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
          <p className="text-xs mt-1.5 text-right" style={{ color: theme?.textColor || "#94a3b8" }}>
            {progress}% complete
          </p>
        </div>

        <div
          className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all hover:shadow-md"
          style={{
            backgroundColor: bgColor,
            borderRadius: theme?.borderRadius || "1rem",
            fontFamily: theme?.fontFamily || "inherit",
          }}
        >
          {/* Logo */}
          {theme?.logoUrl && (
            <img src={theme.logoUrl} alt="Logo" className="h-10 mb-6" />
          )}

          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: theme?.textColor || "#1a1a2e" }}
          >
            {form.title}
          </h1>
          {form.description && (
            <p className="mb-8" style={{ color: theme?.textColor || "#64748b" }}>
              {form.description}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Optional respondent info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Your Name (optional)</Label>
                <Input
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Your Email (optional)</Label>
                <Input
                  type="email"
                  value={respondentEmail}
                  onChange={(e) => setRespondentEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
            </div>

            {sortedFields.map((field, index) => {
              const visible = shouldShowField(field);
              return (
                <div
                  key={field.id}
                  className={`transition-all duration-300 ${
                    visible ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0 overflow-hidden pointer-events-none"
                  }`}
                >
                  <Label className="text-base font-medium" style={{ color: theme?.textColor || "#1a1a2e" }}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.helpText && (
                    <p className="text-sm mb-1" style={{ color: theme?.textColor || "#64748b" }}>
                      {field.helpText}
                    </p>
                  )}

                  {(field.type === "short_text" || field.type === "email") && (
                    <Input
                      value={responses[field.id] || ""}
                      onChange={(e) => setResponses((p) => ({ ...p, [field.id]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                      type={field.type === "email" ? "email" : "text"}
                      className="mt-1"
                    />
                  )}

                  {field.type === "long_text" && (
                    <Textarea
                      value={responses[field.id] || ""}
                      onChange={(e) => setResponses((p) => ({ ...p, [field.id]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                      className="mt-1"
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      type="number"
                      value={responses[field.id] || ""}
                      onChange={(e) => setResponses((p) => ({ ...p, [field.id]: e.target.value }))}
                      placeholder={field.placeholder || ""}
                      className="mt-1"
                    />
                  )}

                  {field.type === "date" && (
                    <Input
                      type="date"
                      value={responses[field.id] || ""}
                      onChange={(e) => setResponses((p) => ({ ...p, [field.id]: e.target.value }))}
                      className="mt-1"
                    />
                  )}

                  {(field.type === "single_select" || field.type === "dropdown") && (
                    <div className="mt-2 space-y-2">
                      {field.options?.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setResponses((p) => ({ ...p, [field.id]: opt }))}
                          className={`w-full flex items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                            responses[field.id] === opt
                              ? "border-2 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                          style={{
                            borderColor: responses[field.id] === opt ? primaryColor : undefined,
                            backgroundColor: responses[field.id] === opt ? `${primaryColor}10` : undefined,
                          }}
                        >
                          <div
                            className="h-4 w-4 rounded-full border-2 flex items-center justify-center transition-colors"
                            style={{
                              borderColor: responses[field.id] === opt ? primaryColor : "#cbd5e1",
                            }}
                          >
                            {responses[field.id] === opt && (
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                            )}
                          </div>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {(field.type === "multi_select" || field.type === "checkbox") && (
                    <div className="mt-2 space-y-2">
                      {field.options?.map((opt, i) => {
                        const current = (responses[field.id] as string[]) || [];
                        const checked = current.includes(opt);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              const next = checked
                                ? current.filter((v: string) => v !== opt)
                                : [...current, opt];
                              setResponses((p) => ({ ...p, [field.id]: next }));
                            }}
                            className={`w-full flex items-center gap-3 rounded-lg border p-3 text-sm transition-all ${
                              checked ? "border-2 shadow-sm" : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                            }`}
                            style={{
                              borderColor: checked ? primaryColor : undefined,
                              backgroundColor: checked ? `${primaryColor}10` : undefined,
                            }}
                          >
                            <div
                              className="h-4 w-4 rounded border-2 flex items-center justify-center transition-colors"
                              style={{
                                borderColor: checked ? primaryColor : "#cbd5e1",
                                backgroundColor: checked ? primaryColor : "transparent",
                              }}
                            >
                              {checked && (
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {field.type === "rating" && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const current = responses[field.id] as number;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setResponses((p) => ({ ...p, [field.id]: star }))}
                            className="p-1 transition-transform hover:scale-110 active:scale-95"
                          >
                            <Star
                              className={`h-8 w-8 transition-all ${
                                current && current >= star
                                  ? "fill-current"
                                  : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
                              }`}
                              style={{
                                color: current && current >= star ? primaryColor : undefined,
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {visibleFields.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">No fields match the current criteria.</p>
              </div>
            )}

            <div className="pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 text-base font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: primaryColor,
                  borderRadius: theme?.borderRadius || "0.5rem",
                }}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs mt-4 text-slate-400 dark:text-slate-600">
          Powered by FormFlow
        </p>
      </div>
    </div>
  );
}
