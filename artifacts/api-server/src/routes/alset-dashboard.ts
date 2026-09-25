import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetClaimsTable, alsetTowingTable, alsetRentalsTable, alsetVehiclesTable, alsetWorkOrdersTable } from "@workspace/db/schema";
import { canViewClaim, canViewRental, canViewTowingJob, canViewVehicle } from "../lib/alset-access";
import { getRequestUser } from "../lib/alset-auth";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

async function canAccessWorkOrder(
  user: NonNullable<ReturnType<typeof getRequestUser>>,
  workOrder: typeof alsetWorkOrdersTable.$inferSelect,
) {
  if (user.role === "admin") {
    return true;
  }

  if (user.role === "shop") {
    return workOrder.shopId === user.userId;
  }

  if (user.role === "owner") {
    const [vehicle] = await db
      .select({ ownerId: alsetVehiclesTable.ownerId })
      .from(alsetVehiclesTable)
      .where(eq(alsetVehiclesTable.id, workOrder.vehicleId))
      .limit(1);
    return vehicle?.ownerId === user.userId;
  }

  if (user.role === "insurer" && workOrder.claimId) {
    const [claim] = await db
      .select({ insurerId: alsetClaimsTable.insurerId })
      .from(alsetClaimsTable)
      .where(eq(alsetClaimsTable.id, workOrder.claimId))
      .limit(1);
    return claim?.insurerId === user.userId;
  }

  return false;
}

router.get("/alset/dashboard/stats", async (req, res) => {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [allClaims, allWorkOrders, allTowing, allRentals, allVehicles] = await Promise.all([
      db.select().from(alsetClaimsTable),
      db.select().from(alsetWorkOrdersTable),
      db.select().from(alsetTowingTable),
      db.select().from(alsetRentalsTable),
      db.select().from(alsetVehiclesTable),
    ]);
    const visibleClaims = allClaims.filter(claim => canViewClaim(user, claim));
    const visibleWorkOrders = (
      await Promise.all(
        allWorkOrders.map(async workOrder => ((await canAccessWorkOrder(user, workOrder)) ? workOrder : null)),
      )
    ).filter((workOrder): workOrder is typeof alsetWorkOrdersTable.$inferSelect => workOrder !== null);
    const visibleTowing = allTowing.filter(job => canViewTowingJob(user, job));
    const visibleRentals = allRentals.filter(rental => canViewRental(user, rental));
    const visibleVehicles = allVehicles.filter(vehicle => canViewVehicle(user, vehicle));

    const openClaimStatuses = ["submitted", "under-review"];
    const activeWoStatuses = ["assigned", "in-progress", "awaiting-parts"];
    const pendingTowStatuses = ["requested", "assigned", "en-route", "arrived"];
    const activeRentalStatuses = ["confirmed", "active"];

    const recentActivity = [
      ...visibleClaims.slice(-3).map(c => ({
        id: "claim-" + c.id,
        type: "claim" as const,
        message: `Claim ${c.claimNumber} — ${c.status}`,
        timestamp: c.updatedAt.toISOString(),
        status: c.status,
      })),
      ...visibleWorkOrders.slice(-2).map(w => ({
        id: "wo-" + w.id,
        type: "work-order" as const,
        message: `Work Order ${w.workOrderNumber} — ${w.status}`,
        timestamp: w.updatedAt.toISOString(),
        status: w.status,
      })),
      ...visibleTowing.slice(-2).map(t => ({
        id: "tow-" + t.id,
        type: "towing" as const,
        message: `Tow Job ${t.jobNumber} — ${t.status}`,
        timestamp: t.createdAt.toISOString(),
        status: t.status,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    res.json({
      totalClaims: visibleClaims.length,
      openClaims: visibleClaims.filter(c => openClaimStatuses.includes(c.status)).length,
      totalWorkOrders: visibleWorkOrders.length,
      activeWorkOrders: visibleWorkOrders.filter(w => activeWoStatuses.includes(w.status)).length,
      pendingTowingJobs: visibleTowing.filter(t => pendingTowStatuses.includes(t.status)).length,
      activeRentals: visibleRentals.filter(r => activeRentalStatuses.includes(r.status)).length,
      totalVehicles: visibleVehicles.length,
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

export default router;
