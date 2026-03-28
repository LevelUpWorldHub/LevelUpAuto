import { pgTable, serial, text, integer, timestamp, numeric, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alsetUsersTable } from "./alset-users";

export const rentalStatusEnum = pgEnum("rental_status", [
  "requested",
  "confirmed",
  "active",
  "returned",
  "cancelled",
]);

export const rentalVehicleTypeEnum = pgEnum("rental_vehicle_type", [
  "sedan",
  "suv",
  "truck",
  "electric",
  "luxury",
]);

export const alsetRentalsTable = pgTable("alset_rentals", {
  id: serial("id").primaryKey(),
  bookingNumber: text("booking_number").notNull().unique(),
  claimId: integer("claim_id"),
  ownerId: integer("owner_id").notNull().references(() => alsetUsersTable.id),
  rentalCompanyId: integer("rental_company_id").references(() => alsetUsersTable.id),
  vehicleType: rentalVehicleTypeEnum("vehicle_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  dailyRate: numeric("daily_rate", { precision: 8, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }),
  status: rentalStatusEnum("status").notNull().default("requested"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlsetRentalSchema = createInsertSchema(alsetRentalsTable).omit({ id: true, bookingNumber: true, status: true, createdAt: true });
export type InsertAlsetRental = z.infer<typeof insertAlsetRentalSchema>;
export type AlsetRental = typeof alsetRentalsTable.$inferSelect;
