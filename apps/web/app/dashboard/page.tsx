"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "~/hooks/use-auth";
import { apiFetch } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  FileText,
  Plus,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
  MoreHorizontal,
  Globe,
  Lock,
  Trash2,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";

interface Form {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  visibility: "public" | "unlisted";
  status: "draft" | "published" | "archived";
  responseCount?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newVisibility, setNewVisibility] = useState<"public" | "unlisted">("public");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadForms = async () => {
    try {
      const data = await apiFetch("/forms");
      setForms(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadForms();
  }, [user]);

  const createForm = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const form = await apiFetch("/forms", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          visibility: newVisibility,
        }),
      });
      toast.success("Form created!");
      setShowCreate(false);
      setNewTitle("");
      router.push(`/dashboard/forms/${form.id}/edit`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  const publishForm = async (formId: string) => {
    try {
      await apiFetch(`/forms/${formId}/publish`, { method: "POST" });
      toast.success("Form published!");
      loadForms();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    }
  };

  const unpublishForm = async (formId: string) => {
    try {
      await apiFetch(`/forms/${formId}/unpublish`, { method: "POST" });
      toast.success("Form unpublished");
      loadForms();
    } catch (err: any) {
      toast.error(err.message || "Failed to unpublish");
    }
  };

  const deleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;
    try {
      await apiFetch(`/forms/${formId}`, { method: "DELETE" });
      toast.success("Form deleted");
      loadForms();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const cloneForm = async (formId: string) => {
    try {
      await apiFetch(`/forms/${formId}/clone`, { method: "POST" });
      toast.success("Form cloned!");
      loadForms();
    } catch (err: any) {
      toast.error(err.message || "Failed to clone");
    }
  };

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/forms/${slug}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

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
              <span className="text-sm text-slate-600 dark:text-slate-400">{user.fullName}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Forms</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage your forms and view responses
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Form
          </Button>
        </div>

        {/* Create Form Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl border border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create New Form</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Form Title</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter form title..."
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && createForm()}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewVisibility("public")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                        newVisibility === "public"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Globe className="h-4 w-4" /> Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewVisibility("unlisted")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-3 text-sm transition-all ${
                        newVisibility === "unlisted"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Lock className="h-4 w-4" /> Unlisted
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => { setShowCreate(false); setNewTitle(""); }}>Cancel</Button>
                  <Button onClick={createForm} disabled={creating || !newTitle.trim()}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Create
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forms Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No forms yet</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-4">
              Create your first form to get started
            </p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Create Form
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {form.visibility === "public" ? (
                      <Globe className="h-4 w-4 text-green-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      form.status === "published"
                        ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                        : form.status === "archived"
                        ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
                    }`}>
                      {form.status === "published" ? "Published" : form.status === "archived" ? "Archived" : "Draft"}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}/edit`)}>
                        <Settings className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}/analytics`)}>
                        <BarChart3 className="h-4 w-4 mr-2" /> Analytics
                      </DropdownMenuItem>
                      {form.status === "published" ? (
                        <DropdownMenuItem onClick={() => unpublishForm(form.id)}>
                          <Eye className="h-4 w-4 mr-2" /> Unpublish
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => publishForm(form.id)}>
                          <Eye className="h-4 w-4 mr-2" /> Publish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => copyLink(form.slug)}>
                        <Copy className="h-4 w-4 mr-2" /> Copy Link
                      </DropdownMenuItem>
                      {form.status === "published" && (
                        <DropdownMenuItem onClick={() => window.open(`/forms/${form.slug}`, "_blank")}>
                          <ExternalLink className="h-4 w-4 mr-2" /> Open
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => cloneForm(form.id)}>
                        <Copy className="h-4 w-4 mr-2" /> Clone
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => deleteForm(form.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Link href={`/dashboard/forms/${form.id}/edit`}>
                  <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {form.title}
                  </h3>
                  {form.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                </Link>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                  <span>{new Date(form.createdAt).toLocaleDateString()}</span>
                  <span>{form.responseCount ?? 0} responses</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
