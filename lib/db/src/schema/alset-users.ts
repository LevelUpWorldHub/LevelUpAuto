import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alsetRoleEnum = pgEnum("alset_role", [
  "owner",
  "shop",
  "insurer",
  "towing",
  "rental",
  "admin",
]);

export const alsetOrganizationsTable = pgTable("alset_organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const alsetUsersTable = pgTable("alset_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: alsetRoleEnum("role").notNull(),
  organizationId: integer("organization_id").references(() => alsetOrganizationsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlsetUserSchema = createInsertSchema(alsetUsersTable).omit({ id: true, createdAt: true });
export type InsertAlsetUser = z.infer<typeof insertAlsetUserSchema>;
export type AlsetUser = typeof alsetUsersTable.$inferSelect;
export type AlsetOrganization = typeof alsetOrganizationsTable.$inferSelect;
