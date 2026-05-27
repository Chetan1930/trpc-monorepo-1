"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "~/hooks/use-auth";
import { apiFetch } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  Globe,
  Lock,
  Sparkles,
  ChevronDown,
  Star,
  Calendar,
  CheckSquare,
  List,
  AlignLeft,
  Mail,
  Hash,
  Palette,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

type FieldType = "short_text" | "long_text" | "email" | "number" | "single_select" | "multi_select" | "checkbox" | "dropdown" | "rating" | "date";

interface Field {
  id: string;
  formId: string;
  type: FieldType;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  order: number;
  options: string[];
  validation: Record<string, any> | null;
  showIf: Record<string, any> | null;
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  visibility: "public" | "unlisted";
  status: "draft" | "published" | "archived";
  themeId: string | null;
  expiryDate: string | null;
  responseLimit: string | null;
}

interface Theme {
  id: string;
  name: string;
  description: string | null;
  config: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    borderRadius: string;
    buttonStyle: string;
  };
}

const FIELD_TYPES: { type: FieldType; label: string; icon: React.ReactNode }[] = [
  { type: "short_text", label: "Short Text", icon: <AlignLeft className="h-4 w-4" /> },
  { type: "long_text", label: "Long Text", icon: <AlignLeft className="h-4 w-4" /> },
  { type: "email", label: "Email", icon: <Mail className="h-4 w-4" /> },
  { type: "number", label: "Number", icon: <Hash className="h-4 w-4" /> },
  { type: "single_select", label: "Single Select", icon: <List className="h-4 w-4" /> },
  { type: "multi_select", label: "Multi Select", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "checkbox", label: "Checkbox", icon: <CheckSquare className="h-4 w-4" /> },
  { type: "dropdown", label: "Dropdown", icon: <ChevronDown className="h-4 w-4" /> },
  { type: "rating", label: "Rating", icon: <Star className="h-4 w-4" /> },
  { type: "date", label: "Date", icon: <Calendar className="h-4 w-4" /> },
];

export default function FormEditorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "unlisted">("public");
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [responseLimit, setResponseLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // Theme state
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadForm = useCallback(async () => {
    try {
      const data = await apiFetch(`/form/getById`, {
        method: "POST",
        body: JSON.stringify({ id: formId }),
      });
      setForm(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setVisibility(data.visibility || "public");
      setResponseLimit(data.responseLimit || "");
      setExpiryDate(data.expiryDate ? data.expiryDate.split("T")[0] : "");
      setSelectedThemeId(data.themeId || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load form");
      router.push("/dashboard");
    }
  }, [formId, router]);

  const loadFields = useCallback(async () => {
    try {
      const data = await apiFetch(`/field/list`, {
        method: "POST",
        body: JSON.stringify({ formId }),
      });
      setFields(Array.isArray(data) ? data : []);
    } catch {
      // Fields may not exist yet
    }
  }, [formId]);

  const loadThemes = useCallback(async () => {
    try {
      const data = await apiFetch(`/theme/list`);
      setThemes(Array.isArray(data) ? data : []);
    } catch {
      // Themes not critical
    }
  }, []);

  useEffect(() => {
    if (user) {
      Promise.all([loadForm(), loadFields(), loadThemes()]).finally(() => setLoading(false));
    }
  }, [user, loadForm, loadFields, loadThemes]);

  const saveForm = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = {
        id: formId,
        title,
        visibility,
      };
      if (description) body.description = description;
      if (responseLimit) body.responseLimit = responseLimit;
      if (expiryDate) body.expiryDate = new Date(expiryDate).toISOString();
      if (selectedThemeId) body.themeId = selectedThemeId;

      await apiFetch(`/form/update`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      toast.success("Form saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const publishForm = async () => {
    setSaving(true);
    try {
      await apiFetch(`/form/publish`, {
        method: "POST",
        body: JSON.stringify({ id: formId }),
      });
      toast.success("Form published!");
      loadForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish");
    } finally {
      setSaving(false);
    }
  };

  const addField = async (type: FieldType) => {
    try {
      const field = await apiFetch(`/field/add`, {
        method: "POST",
        body: JSON.stringify({
          formId,
          type,
          label: `New ${type.replace(/_/g, " ")}`,
        }),
      });
      setFields((prev) => [...prev, field]);
      setShowFieldPicker(false);
      toast.success("Field added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add field");
    }
  };

  const updateField = async (fieldId: string, data: Partial<Field>) => {
    setFields((prev) => prev.map((f) => (f.id === fieldId ? { ...f, ...data } : f)));
    try {
      await apiFetch(`/field/update`, {
        method: "POST",
        body: JSON.stringify({ id: fieldId, ...data }),
      });
    } catch {
      // Optimistic update
    }
  };

  const deleteField = async (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
    try {
      await apiFetch(`/field/delete`, {
        method: "POST",
        body: JSON.stringify({ id: fieldId }),
      });
      toast.success("Field deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete field");
      loadFields();
    }
  };

  const moveField = async (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newFields.length) return;

    [newFields[index], newFields[swapIndex]] = [newFields[swapIndex]!, newFields[index]!];
    newFields.forEach((f, i) => (f.order = i));
    setFields(newFields);

    try {
      await apiFetch(`/field/reorder`, {
        method: "POST",
        body: JSON.stringify({
          formId,
          fieldIds: newFields.map((f) => f.id),
        }),
      });
    } catch {
      loadFields();
    }
  };

  const addOption = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const options = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
    updateField(fieldId, { options } as any);
  };

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const options = [...(field.options || [])];
    options[optionIndex] = value;
    updateField(fieldId, { options } as any);
  };

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const options = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldId, { options } as any);
  };

  const selectTheme = async (themeId: string) => {
    setSelectedThemeId(themeId);
    setShowThemePicker(false);
    try {
      await apiFetch(`/form/update`, {
        method: "POST",
        body: JSON.stringify({ id: formId, themeId }),
      });
      toast.success("Theme applied!");
      loadForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to apply theme");
    }
  };

  const formUrl = form ? `${typeof window !== "undefined" ? window.location.origin : ""}/forms/${form.slug}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user || !form) return null;

  if (previewMode) {
    const selectedTheme = themes.find((t) => t.id === selectedThemeId);
    const tc = selectedTheme?.config;
    const bgColor = tc?.backgroundColor || "#ffffff";
    const primColor = tc?.primaryColor || "#6366f1";

    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Editor
          </Button>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Preview</span>
        </div>
        <div className="mx-auto max-w-2xl px-4 py-12">
          <div
            className="rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm"
            style={{
              backgroundColor: bgColor,
              borderRadius: tc?.borderRadius || "1rem",
              fontFamily: tc?.fontFamily || "inherit",
            }}
          >
            <h1 className="text-2xl font-bold mb-2" style={{ color: tc?.textColor || "#1a1a2e" }}>{title}</h1>
            {description && <p className="mb-8" style={{ color: tc?.textColor || "#64748b" }}>{description}</p>}
            <div className="space-y-6">
              {fields.map((field) => (
                <div key={field.id}>
                  <Label className="text-base" style={{ color: tc?.textColor || "#1a1a2e" }}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.helpText && <p className="text-sm mb-1" style={{ color: tc?.textColor || "#64748b" }}>{field.helpText}</p>}
                  {(field.type === "short_text" || field.type === "email") && <Input placeholder={field.placeholder || ""} className="mt-1" />}
                  {field.type === "long_text" && <Textarea placeholder={field.placeholder || ""} className="mt-1" />}
                  {field.type === "number" && <Input type="number" placeholder={field.placeholder || ""} className="mt-1" />}
                  {field.type === "date" && <Input type="date" className="mt-1" />}
                  {(field.type === "single_select" || field.type === "dropdown") && (
                    <div className="mt-2 space-y-2">
                      {field.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700">
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(field.type === "multi_select" || field.type === "checkbox") && (
                    <div className="mt-2 space-y-2">
                      {field.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded border-2 border-slate-300" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {field.type === "rating" && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-8 w-8" style={{ color: "#cbd5e1" }} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button className="mt-8 w-full" style={{ backgroundColor: primColor, borderRadius: tc?.borderRadius || "0.5rem" }}>Submit</Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedTheme = themes.find((t) => t.id === selectedThemeId);

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
              <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)}>
                <Eye className="h-4 w-4 mr-1" /> Preview
              </Button>
              <Button variant="outline" size="sm" onClick={saveForm} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
              {form.status !== "published" && (
                <Button size="sm" onClick={publishForm} disabled={saving}>
                  Publish
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Form Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Form Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="form-title">Form Title</Label>
              <Input
                id="form-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="form-desc">Description</Label>
              <Textarea
                id="form-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label>Visibility</Label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setVisibility("public")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition-all ${
                    visibility === "public"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Globe className="h-4 w-4" /> Public
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility("unlisted")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition-all ${
                    visibility === "unlisted"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Lock className="h-4 w-4" /> Unlisted
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="response-limit">Response Limit (optional)</Label>
              <Input
                id="response-limit"
                type="number"
                value={responseLimit}
                onChange={(e) => setResponseLimit(e.target.value)}
                placeholder="Unlimited"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="expiry-date">Expiry Date (optional)</Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Theme Selector */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-base font-medium">Theme</Label>
              <Button variant="outline" size="sm" onClick={() => setShowThemePicker(!showThemePicker)}>
                <Palette className="h-4 w-4 mr-1" />
                {selectedTheme ? "Change Theme" : "Select Theme"}
              </Button>
            </div>

            {selectedTheme && !showThemePicker && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div
                  className="h-8 w-8 rounded-full border-2"
                  style={{ backgroundColor: selectedTheme.config.primaryColor, borderColor: selectedTheme.config.backgroundColor }}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedTheme.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedTheme.description}</p>
                </div>
              </div>
            )}

            {showThemePicker && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => selectTheme(theme.id)}
                    className={`relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                      selectedThemeId === theme.id
                        ? "border-indigo-500 shadow-sm"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                    style={{ backgroundColor: theme.config.backgroundColor }}
                  >
                    {selectedThemeId === theme.id && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: theme.config.primaryColor }} />
                      <span className="text-xs font-semibold" style={{ color: theme.config.textColor }}>
                        {theme.name}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: theme.config.textColor, opacity: 0.7 }}>
                      {theme.description}
                    </p>
                    <div className="mt-2 flex gap-1">
                      <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: theme.config.primaryColor }} />
                      <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: theme.config.textColor, opacity: 0.3 }} />
                      <div className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: theme.config.backgroundColor, border: "1px solid #e2e8f0" }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Form Fields</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">{fields.length} fields</span>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-1 pt-2">
                  <button
                    type="button"
                    onClick={() => moveField(index, "up")}
                    disabled={index === 0}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, "down")}
                    disabled={index === fields.length - 1}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
                      {field.type.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-2 ml-auto">
                      <Label className="text-xs flex items-center gap-1">
                        Required
                        <Switch
                          checked={field.required}
                          onCheckedChange={(v) => updateField(field.id, { required: v } as any)}
                        />
                      </Label>
                      <button
                        type="button"
                        onClick={() => deleteField(field.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value } as any)}
                    placeholder="Field label"
                    className="font-medium"
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      value={field.placeholder || ""}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value } as any)}
                      placeholder="Placeholder text"
                    />
                    <Textarea
                      value={field.helpText || ""}
                      onChange={(e) => updateField(field.id, { helpText: e.target.value } as any)}
                      placeholder="Help text"
                      rows={1}
                      className="min-h-[36px]"
                    />
                  </div>

                  {/* Options for select types */}
                  {["single_select", "multi_select", "checkbox", "dropdown"].includes(field.type) && (
                    <div className="space-y-2 pl-2 border-l-2 border-indigo-200 dark:border-indigo-800">
                      {(field.options || []).map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(field.id, optIndex, e.target.value)}
                            placeholder={`Option ${optIndex + 1}`}
                            className="text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(field.id, optIndex)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addOption(field.id)}>
                        <Plus className="h-3 w-3 mr-1" /> Add Option
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Add Field Button */}
          {showFieldPicker ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 p-5">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {FIELD_TYPES.map((ft) => (
                  <button
                    key={ft.type}
                    type="button"
                    onClick={() => addField(ft.type)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-xs hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all"
                  >
                    {ft.icon}
                    <span className="text-center">{ft.label}</span>
                  </button>
                ))}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowFieldPicker(false)} className="mt-3">
                Cancel
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowFieldPicker(true)}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-slate-500 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
            >
              <Plus className="h-6 w-6 mx-auto mb-1" />
              <span className="text-sm font-medium">Add Field</span>
            </button>
          )}
        </div>

        {/* Share Link & QR Code */}
        {form.status === "published" && (
          <div className="mt-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <Label className="text-sm font-medium">Share Form</Label>
            <div className="flex gap-2 mt-2">
              <Input value={formUrl} readOnly className="text-sm flex-1" />
              <Button variant="outline" size="sm" onClick={copyLink}>
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrVisible(!qrVisible)}
              >
                <QrCode className="h-4 w-4 mr-1" /> QR
              </Button>
            </div>

            {qrVisible && (
              <div className="mt-4 flex items-center justify-center">
                <div className="bg-white p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formUrl)}`}
                    alt="QR Code"
                    className="h-40 w-40"
                  />
                  <p className="text-xs text-center text-slate-500 mt-2">Scan to open form</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
