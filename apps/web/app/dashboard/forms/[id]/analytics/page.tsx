"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "~/hooks/use-auth";
import { apiFetch } from "~/lib/api";
import { Button } from "~/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  BarChart3,
  Users,
  Clock,
  TrendingUp,
  Download,
  Trash2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";

interface Analytics {
  totalResponses: number;
  recentResponses: any[];
  dailyData: { date: string; count: number }[];
  formStatus: string;
  publishedAt: string | null;
}

interface Response {
  id: string;
  data: Record<string, any>;
  respondentEmail: string | null;
  respondentName: string | null;
  submittedAt: string;
  timeToComplete: number | null;
}

interface Form {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface Field {
  id: string;
  label: string;
  type: string;
  order: number;
  options: string[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#14b8a6", "#0ea5e9", "#eab308"];

export default function AnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResponses, setShowResponses] = useState(false);
  const [fieldDistribution, setFieldDistribution] = useState<{ name: string; value: number }[]>([]);
  const [responsePage, setResponsePage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const buildFieldDistribution = (responses: Response[], fields: Field[]) => {
    // For select/rating fields, compute value distributions
    const distributions: { name: string; value: number }[] = [];
    
    for (const field of fields) {
      if (["single_select", "dropdown", "rating"].includes(field.type)) {
        const counts: Record<string, number> = {};
        for (const r of responses) {
          const val = r.data[field.id] || r.data[String(field.order)];
          if (val !== undefined && val !== null && val !== "") {
            const key = String(val);
            counts[key] = (counts[key] || 0) + 1;
          }
        }
        // Just take the top field for the pie chart
        if (Object.keys(counts).length > 0 && distributions.length === 0) {
          Object.entries(counts).forEach(([name, value]) => {
            distributions.push({ name: name.length > 15 ? name.substring(0, 15) + "..." : name, value });
          });
        }
      }
    }
    return distributions;
  };

  const getFieldLabel = (key: string, fields: Field[]): string => {
    // Try finding by field ID first, then by order index
    const field = fields.find((f) => f.id === key) || fields[parseInt(key)];
    return field?.label || key.substring(0, 8);
  };

  const loadData = useCallback(async () => {
    try {
      const [formData, analyticsData, responsesData, fieldsData] = await Promise.all([
        apiFetch(`/forms/${formId}`),
        apiFetch(`/responses/${formId}/analytics`),
        apiFetch(`/responses/${formId}?limit=100&offset=0`),
        apiFetch(`/fields?formId=${formId}`),
      ]);
      setForm(formData);
      setAnalytics(analyticsData);
      
      const respArr = Array.isArray(responsesData) ? responsesData : [];
      setResponses(respArr);
      
      const fieldsArr = Array.isArray(fieldsData) ? fieldsData : [];
      setFields(fieldsArr);

      if (respArr.length > 0 && fieldsArr.length > 0) {
        setFieldDistribution(buildFieldDistribution(respArr, fieldsArr));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load data");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [formId, router]);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const exportCSV = async () => {
    try {
      const csv = await apiFetch(`/responses/${formId}/export`);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${form?.title || "form"}-responses.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!confirm("Delete this response?")) return;
    try {
      await apiFetch(`/responses/${responseId}`, { method: "DELETE" });
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
      toast.success("Response deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || !form) return null;

  const paginatedResponses = responses.slice(responsePage * pageSize, (responsePage + 1) * pageSize);
  const totalPages = Math.ceil(responses.length / pageSize);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              </Link>
              <Link href="/" className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-lg font-bold text-slate-900 dark:text-white">FormFlow</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/forms/${formId}/edit`}>
                <Button variant="outline" size="sm">Edit Form</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-1" /> Export CSV
              </Button>
              <Button
                size="sm"
                onClick={() => setShowResponses(!showResponses)}
              >
                {showResponses ? "Analytics" : "Responses"} ({responses.length})
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">
          {form.title} - {showResponses ? "Responses" : "Analytics"}
        </h1>

        {showResponses ? (
          /* Responses View */
          <div className="space-y-4">
            {responses.length === 0 ? (
              <div className="text-center py-20">
                <Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">No responses yet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Share your form to start collecting responses
                </p>
              </div>
            ) : (
              <>
                {paginatedResponses.map((response) => (
                  <div
                    key={response.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(response.submittedAt).toLocaleString()}</span>
                        {response.respondentName && <span>by {response.respondentName}</span>}
                        {response.timeToComplete && (
                          <span>({response.timeToComplete}s)</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteResponse(response.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(response.data).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {getFieldLabel(key, fields)}:
                          </span>{" "}
                          <span className="text-slate-600 dark:text-slate-400">
                            {Array.isArray(value) ? value.join(", ") : String(value || "")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResponsePage(Math.max(0, responsePage - 1))}
                      disabled={responsePage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Page {responsePage + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setResponsePage(Math.min(totalPages - 1, responsePage + 1))}
                      disabled={responsePage >= totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Analytics View */
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <BarChart3 className="h-4 w-4" />
                  Total Responses
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {analytics?.totalResponses || 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <TrendingUp className="h-4 w-4" />
                  Status
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white capitalize">
                  {analytics?.formStatus || "draft"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <Users className="h-4 w-4" />
                  Recent (7d)
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {analytics?.dailyData?.reduce((sum, d) => sum + d.count, 0) || 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <Users className="h-4 w-4" />
                  Fields
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{fields.length}</p>
              </div>
            </div>

            {/* Daily Chart with Recharts */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Daily Responses (Last 7 Days)</h3>
              {analytics?.dailyData && analytics.dailyData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.dailyData.map((d) => ({
                      ...d,
                      label: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#6366f1"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 py-10 text-center">
                  No data for the last 7 days
                </p>
              )}
            </div>

            {/* Field Distribution PieChart */}
            {fieldDistribution.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Response Distribution</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fieldDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={true}
                      >
                        {fieldDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Responses Preview */}
            {analytics?.recentResponses && analytics.recentResponses.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
                <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Recent Responses</h3>
                <div className="space-y-3">
                  {analytics.recentResponses.slice(0, 5).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {new Date(r.submittedAt).toLocaleString()}
                      </span>
                      <span className="text-slate-500 dark:text-slate-500">
                        {r.respondentName || "Anonymous"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
