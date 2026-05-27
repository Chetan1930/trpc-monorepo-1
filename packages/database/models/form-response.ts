import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const formResponsesTable = pgTable("form_responses", {
  id: uuid("id").primaryKey().defaultRandom(),

  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),

  // Full response data as JSON - keyed by field ID
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),

  // Respondent info (optional)
  respondentEmail: varchar("respondent_email", { length: 255 }),
  respondentName: varchar("respondent_name", { length: 255 }),

  // Metadata
  submittedAt: timestamp("submitted_at").defaultNow(),
  timeToComplete: integer("time_to_complete"), // seconds
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
});

export type SelectFormResponse = typeof formResponsesTable.$inferSelect;
export type InsertFormResponse = typeof formResponsesTable.$inferInsert;
