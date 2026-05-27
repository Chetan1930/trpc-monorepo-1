import { db } from "@repo/database";
import { formResponsesTable, formsTable, usersTable } from "@repo/database/schema";
import { eq, and, desc, count, sql } from "@repo/database";
import NotificationService from "../notification";

class ResponseService {
  private notificationService = new NotificationService();
  public async submitResponse(formId: string, data: {
    formData: Record<string, unknown>;
    respondentEmail?: string;
    respondentName?: string;
    ipAddress?: string;
    userAgent?: string;
    timeToComplete?: number;
  }) {
    // Check if form exists and is published
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!form) throw new Error("Form not found");
    if (form.status !== "published") throw new Error("Form is not accepting responses");

    // Check expiry
    if (form.expiryDate && new Date(form.expiryDate) < new Date()) {
      throw new Error("Form has expired");
    }

    // Check response limit
    if (form.responseLimit && form.responseLimit > 0) {
      const [result] = await db
        .select({ count: count() })
        .from(formResponsesTable)
        .where(eq(formResponsesTable.formId, formId));

      if (result && result.count >= form.responseLimit) {
        throw new Error("Response limit reached");
      }
    }

    const [response] = await db
      .insert(formResponsesTable)
      .values({
        formId,
        data: data.formData,
        respondentEmail: data.respondentEmail,
        respondentName: data.respondentName,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        timeToComplete: data.timeToComplete,
      })
      .returning();

    // Send notifications asynchronously (don't block response)
    if (response) {
      // Fetch creator info for notification
      const [creator] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(usersTable)
        .where(eq(usersTable.id, form.creatorId))
        .limit(1);

      if (creator?.email) {
        this.notificationService.notifyNewResponse({
          creatorEmail: creator.email,
          creatorName: creator.fullName || "Creator",
          formTitle: form.title,
          formSlug: form.slug,
          respondentName: data.respondentName,
          responseId: response.id,
        }).catch((err) => console.error("[Notification] Failed to notify creator:", err));
      }

      if (data.respondentEmail) {
        this.notificationService.notifyRespondent({
          respondentEmail: data.respondentEmail,
          respondentName: data.respondentName,
          formTitle: form.title,
        }).catch((err) => console.error("[Notification] Failed to notify respondent:", err));
      }
    }

    return response;
  }

  public async getResponses(formId: string, userId: string, limit = 50, offset = 0) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!form) throw new Error("Form not found");
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    return db
      .select()
      .from(formResponsesTable)
      .where(eq(formResponsesTable.formId, formId))
      .orderBy(desc(formResponsesTable.submittedAt))
      .limit(limit)
      .offset(offset);
  }

  public async getResponseCount(formId: string, userId: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!form) throw new Error("Form not found");
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    const [result] = await db
      .select({ count: count() })
      .from(formResponsesTable)
      .where(eq(formResponsesTable.formId, formId));

    return result?.count ?? 0;
  }

  public async getAnalytics(formId: string, userId: string) {
    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, formId))
      .limit(1);

    if (!form) throw new Error("Form not found");
    if (form.creatorId !== userId) throw new Error("Unauthorized");

    const [countResult] = await db
      .select({ count: count() })
      .from(formResponsesTable)
      .where(eq(formResponsesTable.formId, formId));
    const totalResponses = countResult?.count ?? 0;

    const recentResponses = await db
      .select()
      .from(formResponsesTable)
      .where(eq(formResponsesTable.formId, formId))
      .orderBy(desc(formResponsesTable.submittedAt))
      .limit(5);

    // Get daily submission counts for the last 7 days
    const dailyData = await db.execute(sql`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as count
      FROM form_responses
      WHERE form_id = ${formId}
        AND submitted_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    `);

    return {
      totalResponses,
      recentResponses,
      dailyData: dailyData.rows || [],
      formStatus: form.status,
      publishedAt: form.publishedAt,
    };
  }

  public async deleteResponse(responseId: string, userId: string) {
    const [response] = await db
      .select()
      .from(formResponsesTable)
      .where(eq(formResponsesTable.id, responseId))
      .limit(1);

    if (!response) throw new Error("Response not found");

    const [form] = await db
      .select()
      .from(formsTable)
      .where(eq(formsTable.id, response.formId))
      .limit(1);

    if (!form || form.creatorId !== userId) throw new Error("Unauthorized");

    await db.delete(formResponsesTable).where(eq(formResponsesTable.id, responseId));
    return { success: true };
  }

  public async exportResponsesCSV(formId: string, userId: string) {
    const responses = await this.getResponses(formId, userId, 10000, 0);
    if (!responses.length) return "";

    // Collect all unique keys from all responses
    const allKeys = new Set<string>();
    responses.forEach((r) => Object.keys(r.data).forEach((k) => allKeys.add(k)));

    const headers = ["Submitted At", "Respondent Email", "Respondent Name", ...Array.from(allKeys)];
    const csvRows = [headers.join(",")];

    responses.forEach((r) => {
      const row = [
        r.submittedAt?.toISOString() || "",
        r.respondentEmail || "",
        r.respondentName || "",
        ...Array.from(allKeys).map((k) => {
          const val = r.data[k];
          if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
          return `"${JSON.stringify(val)}"`;
        }),
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }
}

export default ResponseService;
