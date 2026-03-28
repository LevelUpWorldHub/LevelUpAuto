import { pgTable, serial, text, integer, timestamp, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alsetUsersTable } from "./alset-users";
import { alsetVehiclesTable } from "./alset-vehicles";

export const claimStatusEnum = pgEnum("claim_status", [
  "submitted",
  "under-review",
  "approved",
  "denied",
  "paid",
  "closed",
]);

export const claimPriorityEnum = pgEnum("claim_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const alsetClaimsTable = pgTable("alset_claims", {
  id: serial("id").primaryKey(),
  claimNumber: text("claim_number").notNull().unique(),
  vehicleId: integer("vehicle_id").notNull().references(() => alsetVehiclesTable.id),
  ownerId: integer("owner_id").notNull().references(() => alsetUsersTable.id),
  insurerId: integer("insurer_id").references(() => alsetUsersTable.id),
  workOrderId: integer("work_order_id"),
  incidentDate: date("incident_date").notNull(),
  incidentDescription: text("incident_description").notNull(),
  estimatedDamage: numeric("estimated_damage", { precision: 10, scale: 2 }),
  approvedAmount: numeric("approved_amount", { precision: 10, scale: 2 }),
  status: claimStatusEnum("status").notNull().default("submitted"),
  priority: claimPriorityEnum("priority").notNull().default("medium"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAlsetClaimSchema = createInsertSchema(alsetClaimsTable).omit({ id: true, claimNumber: true, status: true, createdAt: true, updatedAt: true });
export type InsertAlsetClaim = z.infer<typeof insertAlsetClaimSchema>;
export type AlsetClaim = typeof alsetClaimsTable.$inferSelect;
