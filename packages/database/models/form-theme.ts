import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const formThemesTable = pgTable("form_themes", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  isDefault: boolean("is_default").default(false),
  isPublic: boolean("is_public").default(false),

  // Theme configuration
  config: jsonb("config")
    .$type<{
      primaryColor: string;
      backgroundColor: string;
      textColor: string;
      fontFamily: string;
      borderRadius: string;
      buttonStyle: "solid" | "outline" | "rounded";
      backgroundImage?: string;
      logoUrl?: string;
    }>()
    .notNull(),

  creatorId: uuid("creator_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SelectFormTheme = typeof formThemesTable.$inferSelect;
export type InsertFormTheme = typeof formThemesTable.$inferInsert;
