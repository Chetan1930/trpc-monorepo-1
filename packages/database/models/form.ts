import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";
import { formThemesTable } from "./form-theme";

export const formVisibilityEnum = pgEnum("form_visibility", ["public", "unlisted"]);
export const formStatusEnum = pgEnum("form_status", ["draft", "published", "archived"]);

export const formsTable = pgTable("forms", {
  id: uuid("id").primaryKey().defaultRandom(),

  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),

  visibility: formVisibilityEnum("visibility").default("public").notNull(),
  status: formStatusEnum("status").default("draft").notNull(),

  creatorId: uuid("creator_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  themeId: uuid("theme_id").references(() => formThemesTable.id, {
    onDelete: "set null",
  }),

  expiryDate: timestamp("expiry_date"),
  responseLimit: integer("response_limit"), // null = unlimited

  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
