import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  alsetClaimsTable,
  alsetTowingTable,
  alsetRentalsTable,
  alsetVehiclesTable,
  alsetWorkOrdersTable,
} from "@workspace/db/schema";
import {
  canViewClaim,
  canViewRental,
  canViewTowingJob,
  canViewVehicle,
  canViewWorkOrder,
} from "../lib/alset-access";
import { getRequestUser } from "../lib/alset-auth";

const router: IRouter = Router();

router.get("/alset/dashboard/stats", async (req, res) => {
  try {
    const user = await getRequestUser(req);
    if (!user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [allClaims, allWorkOrders, allTowing, allRentals, allVehicles] = await Promise.all([
      db.select().from(alsetClaimsTable),
      db.select().from(alsetWorkOrdersTable),
      db.select().from(alsetTowingTable),
      db.select().from(alsetRentalsTable),
      db.select().from(alsetVehiclesTable),
    ]);

    const vehicleOwnerById = new Map(
      allVehicles.map((vehicle) => [vehicle.id, vehicle.ownerId]),
    );
    const claimInsurerById = new Map(
      allClaims.map((claim) => [claim.id, claim.insurerId ?? null]),
    );
    const shopVehicleIds = new Set(
      allWorkOrders
        .filter((workOrder) => workOrder.shopId === user.userId)
        .map((workOrder) => workOrder.vehicleId),
    );

    const visibleClaims = allClaims.filter((claim) => canViewClaim(user, claim));
    const visibleWorkOrders = allWorkOrders.filter((workOrder) =>
      canViewWorkOrder(user, workOrder, {
        vehicleOwnerId: vehicleOwnerById.get(workOrder.vehicleId) ?? null,
        claimInsurerId: workOrder.claimId
          ? claimInsurerById.get(workOrder.claimId) ?? null
          : null,
      }),
    );
    const visibleTowing = allTowing.filter((job) => canViewTowingJob(user, job));
    const visibleRentals = allRentals.filter((rental) => canViewRental(user, rental));
    const visibleVehicles = allVehicles.filter((vehicle) =>
      canViewVehicle(user, vehicle, {
        hasAssignedWorkOrder: shopVehicleIds.has(vehicle.id),
      }),
    );

    const openClaimStatuses = ["submitted", "under-review"];
    const activeWoStatuses = ["assigned", "in-progress", "awaiting-parts"];
    const pendingTowStatuses = ["requested", "assigned", "en-route", "arrived"];
    const activeRentalStatuses = ["confirmed", "active"];

    const recentActivity = [
      ...visibleClaims.slice(-3).map((claim) => ({
        id: "claim-" + claim.id,
        type: "claim" as const,
        message: `Claim ${claim.claimNumber} — ${claim.status}`,
        timestamp: claim.updatedAt.toISOString(),
        status: claim.status,
      })),
      ...visibleWorkOrders.slice(-2).map((workOrder) => ({
        id: "wo-" + workOrder.id,
        type: "work-order" as const,
        message: `Work Order ${workOrder.workOrderNumber} — ${workOrder.status}`,
        timestamp: workOrder.updatedAt.toISOString(),
        status: workOrder.status,
      })),
      ...visibleTowing.slice(-2).map((job) => ({
        id: "tow-" + job.id,
        type: "towing" as const,
        message: `Tow Job ${job.jobNumber} — ${job.status}`,
        timestamp: job.createdAt.toISOString(),
        status: job.status,
      })),
    ].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()).slice(0, 8);

    res.json({
      totalClaims: visibleClaims.length,
      openClaims: visibleClaims.filter((claim) => openClaimStatuses.includes(claim.status)).length,
      totalWorkOrders: visibleWorkOrders.length,
      activeWorkOrders: visibleWorkOrders.filter((workOrder) => activeWoStatuses.includes(workOrder.status)).length,
      pendingTowingJobs: visibleTowing.filter((job) => pendingTowStatuses.includes(job.status)).length,
      activeRentals: visibleRentals.filter((rental) => activeRentalStatuses.includes(rental.status)).length,
      totalVehicles: visibleVehicles.length,
      recentActivity,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

export default router;
