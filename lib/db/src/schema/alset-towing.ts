import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alsetUsersTable } from "./alset-users";
import { alsetVehiclesTable } from "./alset-vehicles";

export const towingStatusEnum = pgEnum("towing_status", [
  "requested",
  "assigned",
  "en-route",
  "arrived",
  "completed",
  "cancelled",
]);

export const alsetTowingTable = pgTable("alset_towing", {
  id: serial("id").primaryKey(),
  jobNumber: text("job_number").notNull().unique(),
  vehicleId: integer("vehicle_id").notNull().references(() => alsetVehiclesTable.id),
  requestedById: integer("requested_by_id").notNull().references(() => alsetUsersTable.id),
  pickupAddress: text("pickup_address").notNull(),
  dropoffAddress: text("dropoff_address").notNull(),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  assignedCompanyId: integer("assigned_company_id").references(() => alsetUsersTable.id),
  driverName: text("driver_name"),
  estimatedArrival: timestamp("estimated_arrival"),
  completedAt: timestamp("completed_at"),
  status: towingStatusEnum("status").notNull().default("requested"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlsetTowingSchema = createInsertSchema(alsetTowingTable).omit({ id: true, jobNumber: true, requestedAt: true, status: true, createdAt: true });
export type InsertAlsetTowing = z.infer<typeof insertAlsetTowingSchema>;
export type AlsetTowing = typeof alsetTowingTable.$inferSelect;
