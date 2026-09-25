import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetVehiclesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateVehicleBody } from "@workspace/api-zod";
import { canCreateVehicle, canViewVehicle } from "../lib/alset-access";
import { getRequestUser } from "../lib/alset-auth";

const router: IRouter = Router();

function vehicleRow(v: typeof alsetVehiclesTable.$inferSelect) {
  return {
    id: v.id,
    ownerId: v.ownerId,
    vin: v.vin,
    model: v.model,
    year: v.year,
    color: v.color,
    licensePlate: v.licensePlate,
    mileage: v.mileage ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}

router.get("/alset/vehicles", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const vehicles = await db.select().from(alsetVehiclesTable);
    const accessibleVehicles = vehicles.filter(vehicle => canViewVehicle(user, vehicle));
    res.json(accessibleVehicles.map(vehicleRow));
  } catch (err) {
    req.log.error({ err }, "Failed to list vehicles");
    res.status(500).json({ error: "Failed to list vehicles" });
  }
});

router.post("/alset/vehicles", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!canCreateVehicle(user)) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [v] = await db.insert(alsetVehiclesTable).values({
      ownerId: user.userId,
      vin: parsed.data.vin,
      model: parsed.data.model as any,
      year: parsed.data.year,
      color: parsed.data.color,
      licensePlate: parsed.data.licensePlate,
      mileage: parsed.data.mileage ?? null,
    }).returning();
    res.status(201).json(vehicleRow(v));
  } catch (err) {
    req.log.error({ err }, "Failed to create vehicle");
    res.status(500).json({ error: "Failed to create vehicle" });
  }
});

router.get("/alset/vehicles/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [v] = await db.select().from(alsetVehiclesTable).where(eq(alsetVehiclesTable.id, Number(req.params.id))).limit(1);
    if (!v) { res.status(404).json({ error: "Vehicle not found" }); return; }
    if (!canViewVehicle(user, v)) { res.status(404).json({ error: "Vehicle not found" }); return; }
    res.json(vehicleRow(v));
  } catch (err) {
    req.log.error({ err }, "Failed to get vehicle");
    res.status(500).json({ error: "Failed to get vehicle" });
  }
});

export default router;
