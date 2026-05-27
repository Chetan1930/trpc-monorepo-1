import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const fieldTypeEnum = pgEnum("field_type", [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "checkbox",
  "dropdown",
  "rating",
  "date",
]);

export const formFieldsTable = pgTable("form_fields", {
  id: uuid("id").primaryKey().defaultRandom(),

  formId: uuid("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),

  type: fieldTypeEnum("type").notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  placeholder: varchar("placeholder", { length: 255 }),
  helpText: text("help_text"),

  required: boolean("required").default(false).notNull(),
  order: integer("order").notNull().default(0),

  // For select/checkbox/dropdown - stored as JSON array of strings
  options: jsonb("options").$type<string[]>().default([]),

  // Validation rules stored as JSON
  validation: jsonb("validation").$type<{
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customError?: string;
  }>(),

  // For conditional logic
  showIf: jsonb("show_if").$type<{
    fieldId: string;
    operator: "equals" | "not_equals" | "contains";
    value: string;
  }>(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;
