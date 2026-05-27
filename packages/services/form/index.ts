import { db } from "@repo/database";
import {
  formsTable,
  formFieldsTable,
  formThemesTable,
  formResponsesTable,
} from "@repo/database/schema";
import { eq, and, desc, asc, count, sql } from "@repo/database";
class FormService {
  public async createForm(creatorId: string, data: {
    title: string;
    description?: string;
    visibility?: "public" | "unlisted";
    themeId?: string;
  }) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Math.random().toString(36).substring(2, 8);

    const [form] = await db
      .insert(formsTable)
      .values({
        title: data.title,
        description: data.description || "",
        slug,
        visibility: data.visibility || "public",
        status: "draft",
        creatorId,
        themeId: data.themeId || null,
      })
      .returning();

    return form;
  }

  public async getFormsByUser(userId: string) {
    return db
      .select()
      .from(formsTable)
      .where(eq(formsTable.creatorId, userId))
      .orderBy(desc(formsTable.updatedAt));
  }

  public async getFormById(formId: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!form) throw new Error("Form not found");
    return form;
  }

  public async getFormBySlug(slug: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.slug, slug))
      .limit(1);

    return form || null;
  }

  public async updateForm(formId: string, userId: string, data: {
    title?: string;
    description?: string;
    visibility?: "public" | "unlisted";
    themeId?: string | null;
    status?: "draft" | "published" | "archived";
    expiryDate?: string | null;
    responseLimit?: number | string | null;
  }) {
    const form = await this.getFormById(formId);
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.themeId !== undefined) updateData.themeId = data.themeId;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate;
    if (data.responseLimit !== undefined) updateData.responseLimit = data.responseLimit !== null && data.responseLimit !== undefined ? Number(data.responseLimit) : null;

    if (data.status === "published") {
      updateData.status = "published";
      updateData.publishedAt = new Date();
    } else if (data.status === "archived") {
      updateData.status = "archived";
    } else if (data.status === "draft") {
      updateData.status = "draft";
    }

    const [updated] = await db
      .update(formsTable)
      .set(updateData)
      .where(eq(formsTable.id, formId))
      .returning();

    return updated;
  }

  public async deleteForm(formId: string, userId: string) {
    const form = await this.getFormById(formId);
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    await db.delete(formsTable).where(eq(formsTable.id, formId));
    return { success: true };
  }

  public async publishForm(formId: string, userId: string) {
    return this.updateForm(formId, userId, { status: "published" });
  }

  public async unpublishForm(formId: string, userId: string) {
    return this.updateForm(formId, userId, { status: "draft" });
  }

  public async getPublicForms(limit = 20, offset = 0) {
    return db
      .select({
        id: formsTable.id,
        title: formsTable.title,
        description: formsTable.description,
        slug: formsTable.slug,
        createdAt: formsTable.createdAt,
        responseCount: sql<number>`(SELECT count(*) FROM ${formResponsesTable} WHERE ${formResponsesTable.formId} = ${formsTable.id})`,
      })
      .from(formsTable)
      .where(
        and(
          eq(formsTable.status, "published"),
          eq(formsTable.visibility, "public"),
        ),
      )
      .orderBy(desc(formsTable.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  // Fields management
  public async getFields(formId: string) {
    return db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.formId, formId))
      .orderBy(asc(formFieldsTable.order));
  }

  public async addField(formId: string, userId: string, data: {
    type: string;
    label: string;
    placeholder?: string;
    helpText?: string;
    required?: boolean;
    options?: string[];
    validation?: Record<string, unknown> | null;
    showIf?: Record<string, unknown> | null;
  }) {
    const form = await this.getFormById(formId);
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    const fields = await this.getFields(formId);
    const order = fields.length;

    const [field] = await db
      .insert(formFieldsTable)
      .values({
        formId,
        type: data.type as any,
        label: data.label,
        placeholder: data.placeholder,
        helpText: data.helpText,
        required: data.required || false,
        options: data.options || [],
        validation: data.validation as any ?? null,
        showIf: data.showIf as any ?? null,
        order,
      })
      .returning();

    return field;
  }

  public async updateField(fieldId: string, userId: string, data: {
    label?: string;
    placeholder?: string | null;
    helpText?: string | null;
    required?: boolean;
    options?: string[];
    validation?: Record<string, unknown> | null;
    showIf?: Record<string, unknown> | null;
    order?: number;
  }) {
    const [field] = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.id, fieldId))
      .limit(1);

    if (!field) throw new Error("Field not found");

    const form = await this.getFormById(field.formId);
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    const [updated] = await db
      .update(formFieldsTable)
      .set(data as any)
      .where(eq(formFieldsTable.id, fieldId))
      .returning();

    return updated;
  }

  public async deleteField(fieldId: string, userId: string) {
    const [field] = await db
      .select()
      .from(formFieldsTable)
      .where(eq(formFieldsTable.id, fieldId))
      .limit(1);

    if (!field) throw new Error("Field not found");

    const form = await this.getFormById(field.formId);
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    await db.delete(formFieldsTable).where(eq(formFieldsTable.id, fieldId));
    return { success: true };
  }

  public async reorderFields(formId: string, userId: string, fieldIds: string[]) {
    const form = await this.getFormById(formId);
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    for (let i = 0; i < fieldIds.length; i++) {
      await db
        .update(formFieldsTable)
        .set({ order: i })
        .where(eq(formFieldsTable.id, fieldIds[i]!));
    }

    return { success: true };
  }

  public async cloneForm(formId: string, userId: string) {
    const form = await this.getFormById(formId);
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    const fields = await this.getFields(formId);

    const slug = (form.title + "-copy-" + Math.random().toString(36).substring(2, 6))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const [newForm] = await db
      .insert(formsTable)
      .values({
        title: form.title + " (Copy)",
        description: form.description,
        slug,
        visibility: form.visibility,
        status: "draft",
        creatorId: userId,
        themeId: form.themeId,
      })
      .returning();

    if (!newForm) throw new Error("Failed to clone form");

    for (const field of fields) {
      await db.insert(formFieldsTable).values({
        formId: newForm.id,
        type: field.type,
        label: field.label,
        placeholder: field.placeholder,
        helpText: field.helpText,
        required: field.required,
        options: field.options,
        validation: field.validation,
        showIf: field.showIf,
        order: field.order,
      });
    }

    return newForm;
  }
}

export default FormService;
