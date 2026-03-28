import { pgTable, serial, text, integer, timestamp, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alsetUsersTable } from "./alset-users";
import { alsetVehiclesTable } from "./alset-vehicles";

export const workOrderStatusEnum = pgEnum("work_order_status", [
  "draft",
  "assigned",
  "in-progress",
  "awaiting-parts",
  "completed",
  "invoiced",
]);

export const alsetWorkOrdersTable = pgTable("alset_work_orders", {
  id: serial("id").primaryKey(),
  workOrderNumber: text("work_order_number").notNull().unique(),
  claimId: integer("claim_id"),
  vehicleId: integer("vehicle_id").notNull().references(() => alsetVehiclesTable.id),
  shopId: integer("shop_id").references(() => alsetUsersTable.id),
  technicianName: text("technician_name"),
  description: text("description").notNull(),
  laborHours: numeric("labor_hours", { precision: 6, scale: 2 }),
  partsTotal: numeric("parts_total", { precision: 10, scale: 2 }),
  laborRate: numeric("labor_rate", { precision: 8, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
  status: workOrderStatusEnum("status").notNull().default("draft"),
  startDate: date("start_date"),
  completionDate: date("completion_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAlsetWorkOrderSchema = createInsertSchema(alsetWorkOrdersTable).omit({ id: true, workOrderNumber: true, status: true, createdAt: true, updatedAt: true });
export type InsertAlsetWorkOrder = z.infer<typeof insertAlsetWorkOrderSchema>;
export type AlsetWorkOrder = typeof alsetWorkOrdersTable.$inferSelect;
