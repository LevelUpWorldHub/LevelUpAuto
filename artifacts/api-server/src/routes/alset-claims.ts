import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetClaimsTable, alsetVehiclesTable, alsetUsersTable, alsetOrganizationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateClaimBody, UpdateClaimBody } from "@workspace/api-zod";
import { verifyToken } from "./alset-auth";

const router: IRouter = Router();

function getUser(req: any) {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

function genClaimNumber() {
  return "CLM-" + Date.now().toString(36).toUpperCase();
}

async function claimRow(c: typeof alsetClaimsTable.$inferSelect) {
  const [vehicle] = await db.select().from(alsetVehiclesTable).where(eq(alsetVehiclesTable.id, c.vehicleId)).limit(1);
  const [owner] = await db.select().from(alsetUsersTable).where(eq(alsetUsersTable.id, c.ownerId)).limit(1);
  let insurerName: string | null = null;
  if (c.insurerId) {
    const [ins] = await db.select().from(alsetUsersTable).where(eq(alsetUsersTable.id, c.insurerId)).limit(1);
    if (ins?.organizationId) {
      const [org] = await db.select().from(alsetOrganizationsTable).where(eq(alsetOrganizationsTable.id, ins.organizationId)).limit(1);
      insurerName = org?.name ?? null;
    }
  }
  return {
    id: c.id,
    claimNumber: c.claimNumber,
    vehicleId: c.vehicleId,
    vehicleVin: vehicle?.vin ?? null,
    vehicleModel: vehicle?.model ?? null,
    ownerId: c.ownerId,
    ownerName: owner?.name ?? null,
    insurerId: c.insurerId ?? null,
    insurerName,
    workOrderId: c.workOrderId ?? null,
    incidentDate: c.incidentDate,
    incidentDescription: c.incidentDescription,
    estimatedDamage: c.estimatedDamage ? parseFloat(c.estimatedDamage) : null,
    approvedAmount: c.approvedAmount ? parseFloat(c.approvedAmount) : null,
    status: c.status,
    priority: c.priority,
    notes: c.notes ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/alset/claims", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const claims = user.role === "owner"
      ? await db.select().from(alsetClaimsTable).where(eq(alsetClaimsTable.ownerId, user.userId))
      : user.role === "insurer"
      ? await db.select().from(alsetClaimsTable).where(eq(alsetClaimsTable.insurerId, user.userId))
      : await db.select().from(alsetClaimsTable);
    const rows = await Promise.all(claims.map(claimRow));
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list claims");
    res.status(500).json({ error: "Failed to list claims" });
  }
});

router.post("/alset/claims", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateClaimBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [c] = await db.insert(alsetClaimsTable).values({
      claimNumber: genClaimNumber(),
      vehicleId: parsed.data.vehicleId,
      ownerId: user.userId,
      incidentDate: parsed.data.incidentDate,
      incidentDescription: parsed.data.incidentDescription,
      estimatedDamage: parsed.data.estimatedDamage?.toString() ?? null,
      priority: parsed.data.priority as any,
      notes: parsed.data.notes ?? null,
    }).returning();
    res.status(201).json(await claimRow(c));
  } catch (err) {
    req.log.error({ err }, "Failed to create claim");
    res.status(500).json({ error: "Failed to create claim" });
  }
});

router.get("/alset/claims/:id", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const [c] = await db.select().from(alsetClaimsTable).where(eq(alsetClaimsTable.id, Number(req.params.id))).limit(1);
    if (!c) { res.status(404).json({ error: "Claim not found" }); return; }
    res.json(await claimRow(c));
  } catch (err) {
    req.log.error({ err }, "Failed to get claim");
    res.status(500).json({ error: "Failed to get claim" });
  }
});

router.patch("/alset/claims/:id", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateClaimBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const updates: any = { updatedAt: new Date() };
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.approvedAmount !== undefined) updates.approvedAmount = parsed.data.approvedAmount?.toString() ?? null;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
    if (parsed.data.insurerId !== undefined) updates.insurerId = parsed.data.insurerId;
    if (parsed.data.workOrderId !== undefined) updates.workOrderId = parsed.data.workOrderId;
    const [c] = await db.update(alsetClaimsTable).set(updates).where(eq(alsetClaimsTable.id, Number(req.params.id))).returning();
    if (!c) { res.status(404).json({ error: "Claim not found" }); return; }
    res.json(await claimRow(c));
  } catch (err) {
    req.log.error({ err }, "Failed to update claim");
    res.status(500).json({ error: "Failed to update claim" });
  }
});

export default router;
