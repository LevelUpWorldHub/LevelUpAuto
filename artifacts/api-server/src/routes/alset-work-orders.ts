import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetClaimsTable, alsetWorkOrdersTable, alsetVehiclesTable, alsetUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateWorkOrderBody, UpdateWorkOrderBody } from "@workspace/api-zod";
import { canCreateWorkOrder, canUpdateWorkOrder, canViewWorkOrder } from "../lib/alset-access";
import { getRequestUser } from "../lib/alset-auth";

const router: IRouter = Router();

function genWoNumber() {
  return "WO-" + Date.now().toString(36).toUpperCase();
}

async function woRow(w: typeof alsetWorkOrdersTable.$inferSelect) {
  const [vehicle] = await db.select().from(alsetVehiclesTable).where(eq(alsetVehiclesTable.id, w.vehicleId)).limit(1);
  let shopName: string | null = null;
  if (w.shopId) {
    const [shop] = await db.select().from(alsetUsersTable).where(eq(alsetUsersTable.id, w.shopId)).limit(1);
    shopName = shop?.name ?? null;
  }
  return {
    id: w.id,
    workOrderNumber: w.workOrderNumber,
    claimId: w.claimId ?? null,
    vehicleId: w.vehicleId,
    vehicleVin: vehicle?.vin ?? null,
    vehicleModel: vehicle?.model ?? null,
    shopId: w.shopId ?? null,
    shopName,
    technicianName: w.technicianName ?? null,
    description: w.description,
    laborHours: w.laborHours ? parseFloat(w.laborHours) : null,
    partsTotal: w.partsTotal ? parseFloat(w.partsTotal) : null,
    laborRate: w.laborRate ? parseFloat(w.laborRate) : null,
    totalCost: w.totalCost ? parseFloat(w.totalCost) : null,
    status: w.status,
    startDate: w.startDate ?? null,
    completionDate: w.completionDate ?? null,
    notes: w.notes ?? null,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

async function canAccessWorkOrder(
  user: NonNullable<ReturnType<typeof getRequestUser>>,
  workOrder: typeof alsetWorkOrdersTable.$inferSelect,
) {
  const [vehicle, claim] = await Promise.all([
    db
      .select({ ownerId: alsetVehiclesTable.ownerId })
      .from(alsetVehiclesTable)
      .where(eq(alsetVehiclesTable.id, workOrder.vehicleId))
      .limit(1),
    workOrder.claimId
      ? db
          .select({ insurerId: alsetClaimsTable.insurerId })
          .from(alsetClaimsTable)
          .where(eq(alsetClaimsTable.id, workOrder.claimId))
          .limit(1)
      : Promise.resolve([]),
  ]);

  return canViewWorkOrder(user, workOrder, {
    vehicleOwnerId: vehicle[0]?.ownerId ?? null,
    claimInsurerId: claim[0]?.insurerId ?? null,
  });
}

router.get("/alset/work-orders", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const orders = await db.select().from(alsetWorkOrdersTable);
    const accessibleOrders = (
      await Promise.all(
        orders.map(async order => ((await canAccessWorkOrder(user, order)) ? order : null)),
      )
    ).filter((order): order is typeof alsetWorkOrdersTable.$inferSelect => order !== null);
    res.json(await Promise.all(accessibleOrders.map(woRow)));
  } catch (err) {
    req.log.error({ err }, "Failed to list work orders");
    res.status(500).json({ error: "Failed to list work orders" });
  }
});

router.post("/alset/work-orders", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!canCreateWorkOrder(user)) { res.status(403).json({ error: "Forbidden" }); return; }
  const parsed = CreateWorkOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [vehicle] = await db
      .select({ id: alsetVehiclesTable.id })
      .from(alsetVehiclesTable)
      .where(eq(alsetVehiclesTable.id, parsed.data.vehicleId))
      .limit(1);
    if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
    const [w] = await db.insert(alsetWorkOrdersTable).values({
      workOrderNumber: genWoNumber(),
      claimId: parsed.data.claimId ?? null,
      vehicleId: parsed.data.vehicleId,
      shopId: user.role === "shop" ? user.userId : null,
      description: parsed.data.description,
      laborHours: parsed.data.laborHours?.toString() ?? null,
      partsTotal: parsed.data.partsTotal?.toString() ?? null,
      laborRate: parsed.data.laborRate?.toString() ?? null,
      startDate: parsed.data.startDate instanceof Date ? parsed.data.startDate.toISOString().split("T")[0] : (parsed.data.startDate ?? null),
      notes: parsed.data.notes ?? null,
    }).returning();
    res.status(201).json(await woRow(w));
  } catch (err) {
    req.log.error({ err }, "Failed to create work order");
    res.status(500).json({ error: "Failed to create work order" });
  }
});

router.get("/alset/work-orders/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [w] = await db.select().from(alsetWorkOrdersTable).where(eq(alsetWorkOrdersTable.id, Number(req.params.id))).limit(1);
    if (!w) { res.status(404).json({ error: "Work order not found" }); return; }
    if (!(await canAccessWorkOrder(user, w))) { res.status(404).json({ error: "Work order not found" }); return; }
    res.json(await woRow(w));
  } catch (err) {
    req.log.error({ err }, "Failed to get work order");
    res.status(500).json({ error: "Failed to get work order" });
  }
});

router.patch("/alset/work-orders/:id", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateWorkOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [currentWorkOrder] = await db
      .select()
      .from(alsetWorkOrdersTable)
      .where(eq(alsetWorkOrdersTable.id, Number(req.params.id)))
      .limit(1);
    if (!currentWorkOrder) { res.status(404).json({ error: "Work order not found" }); return; }
    if (!canUpdateWorkOrder(user, currentWorkOrder)) { res.status(404).json({ error: "Work order not found" }); return; }

    const updates: any = { updatedAt: new Date() };
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.technicianName !== undefined) updates.technicianName = parsed.data.technicianName;
    if (parsed.data.laborHours !== undefined) updates.laborHours = parsed.data.laborHours?.toString() ?? null;
    if (parsed.data.partsTotal !== undefined) updates.partsTotal = parsed.data.partsTotal?.toString() ?? null;
    if (parsed.data.completionDate !== undefined) updates.completionDate = parsed.data.completionDate;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    const [w] = await db.update(alsetWorkOrdersTable).set(updates).where(eq(alsetWorkOrdersTable.id, Number(req.params.id))).returning();
    if (!w) { res.status(404).json({ error: "Work order not found" }); return; }
    res.json(await woRow(w));
  } catch (err) {
    req.log.error({ err }, "Failed to update work order");
    res.status(500).json({ error: "Failed to update work order" });
  }
});

export default router;
