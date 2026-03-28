import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alsetUsersTable } from "./alset-users";

export const teslaModelEnum = pgEnum("tesla_model", [
  "Model S",
  "Model 3",
  "Model X",
  "Model Y",
  "Cybertruck",
  "Roadster",
]);

export const alsetVehiclesTable = pgTable("alset_vehicles", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => alsetUsersTable.id),
  vin: text("vin").notNull().unique(),
  model: teslaModelEnum("model").notNull(),
  year: integer("year").notNull(),
  color: text("color").notNull(),
  licensePlate: text("license_plate").notNull(),
  mileage: integer("mileage"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAlsetVehicleSchema = createInsertSchema(alsetVehiclesTable).omit({ id: true, createdAt: true });
export type InsertAlsetVehicle = z.infer<typeof insertAlsetVehicleSchema>;
export type AlsetVehicle = typeof alsetVehiclesTable.$inferSelect;
