import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetClaimsTable, alsetWorkOrdersTable, alsetTowingTable, alsetRentalsTable, alsetVehiclesTable } from "@workspace/db/schema";
import { eq, count, or } from "drizzle-orm";
import { verifyToken } from "./alset-auth";

const router: IRouter = Router();

function getUser(req: any) {
  const auth = req.headers.authorization ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

router.get("/alset/dashboard/stats", async (req, res) => {
  const user = getUser(req);
  if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const [allClaims, allWorkOrders, allTowing, allRentals, allVehicles] = await Promise.all([
      db.select().from(alsetClaimsTable),
      db.select().from(alsetWorkOrdersTable),
      db.select().from(alsetTowingTable),
      db.select().from(alsetRentalsTable),
      db.select().from(alsetVehiclesTable),
    ]);

    const openClaimStatuses = ["submitted", "under-review"];
    const activeWoStatuses = ["assigned", "in-progress", "awaiting-parts"];
    const pendingTowStatuses = ["requested", "assigned", "en-route", "arrived"];
    const activeRentalStatuses = ["confirmed", "active"];

    const recentActivity = [
      ...allClaims.slice(-3).map(c => ({
        id: "claim-" + c.id,
        type: "claim" as const,
        message: `Claim ${c.claimNumber} — ${c.status}`,
        timestamp: c.updatedAt.toISOString(),
        status: c.status,
      })),
      ...allWorkOrders.slice(-2).map(w => ({
        id: "wo-" + w.id,
        type: "work-order" as const,
        message: `Work Order ${w.workOrderNumber} — ${w.status}`,
        timestamp: w.updatedAt.toISOString(),
        status: w.status,
      })),
      ...allTowing.slice(-2).map(t => ({
        id: "tow-" + t.id,
        type: "towing" as const,
        message: `Tow Job ${t.jobNumber} — ${t.status}`,
        timestamp: t.createdAt.toISOString(),
        status: t.status,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);

    res.json({
      totalClaims: allClaims.length,
      openClaims: allClaims.filter(c => openClaimStatuses.includes(c.status)).length,
      totalWorkOrders: allWorkOrders.length,
      activeWorkOrders: allWorkOrders.filter(w => activeWoStatuses.includes(w.status)).length,
      pendingTowingJobs: allTowing.filter(t => pendingTowStatuses.includes(t.status)).length,
      activeRentals: allRentals.filter(r => activeRentalStatuses.includes(r.status)).length,
      totalVehicles: allVehicles.length,
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

export default router;
