import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetRentalsTable, alsetUsersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateRentalBody, UpdateRentalBody } from "@workspace/api-zod";
import { verifyToken } from "./alset-auth";

const router: IRouter = Router();

function getUser(req: any) {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

function genBookingNumber() {
  return "RNT-" + Date.now().toString(36).toUpperCase();
}

async function rentalRow(r: typeof alsetRentalsTable.$inferSelect) {
  const [owner] = await db.select().from(alsetUsersTable).where(eq(alsetUsersTable.id, r.ownerId)).limit(1);
  let rentalCompanyName: string | null = null;
  if (r.rentalCompanyId) {
    const [co] = await db.select().from(alsetUsersTable).where(eq(alsetUsersTable.id, r.rentalCompanyId)).limit(1);
    rentalCompanyName = co?.name ?? null;
  }
  return {
    id: r.id,
    bookingNumber: r.bookingNumber,
    claimId: r.claimId ?? null,
    ownerId: r.ownerId,
    ownerName: owner?.name ?? null,
    rentalCompanyId: r.rentalCompanyId ?? null,
    rentalCompanyName,
    vehicleType: r.vehicleType,
    startDate: r.startDate,
    endDate: r.endDate ?? null,
    dailyRate: r.dailyRate ? parseFloat(r.dailyRate) : null,
    totalCost: r.totalCost ? parseFloat(r.totalCost) : null,
    status: r.status,
    notes: r.notes ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/alset/rentals", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const rentals = user.role === "owner"
      ? await db.select().from(alsetRentalsTable).where(eq(alsetRentalsTable.ownerId, user.userId))
      : user.role === "rental"
      ? await db.select().from(alsetRentalsTable).where(eq(alsetRentalsTable.rentalCompanyId, user.userId))
      : await db.select().from(alsetRentalsTable);
    res.json(await Promise.all(rentals.map(rentalRow)));
  } catch (err) {
    req.log.error({ err }, "Failed to list rentals");
    res.status(500).json({ error: "Failed to list rentals" });
  }
});

router.post("/alset/rentals", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = CreateRentalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const [r] = await db.insert(alsetRentalsTable).values({
      bookingNumber: genBookingNumber(),
      claimId: parsed.data.claimId ?? null,
      ownerId: user.userId,
      vehicleType: parsed.data.vehicleType as any,
      startDate: parsed.data.startDate,
      notes: parsed.data.notes ?? null,
    }).returning();
    res.status(201).json(await rentalRow(r));
  } catch (err) {
    req.log.error({ err }, "Failed to create rental");
    res.status(500).json({ error: "Failed to create rental" });
  }
});

router.patch("/alset/rentals/:id", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = UpdateRentalBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const updates: any = {};
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.endDate !== undefined) updates.endDate = parsed.data.endDate;
    if (parsed.data.dailyRate !== undefined) updates.dailyRate = parsed.data.dailyRate?.toString() ?? null;
    const [r] = await db.update(alsetRentalsTable).set(updates).where(eq(alsetRentalsTable.id, Number(req.params.id))).returning();
    if (!r) { res.status(404).json({ error: "Rental not found" }); return; }
    res.json(await rentalRow(r));
  } catch (err) {
    req.log.error({ err }, "Failed to update rental");
    res.status(500).json({ error: "Failed to update rental" });
  }
});

export default router;
