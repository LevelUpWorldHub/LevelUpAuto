import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import testimonialsRouter from "./testimonials";
import contactRouter from "./contact";
import alsetAuthRouter from "./alset-auth";
import alsetVehiclesRouter from "./alset-vehicles";
import alsetClaimsRouter from "./alset-claims";
import alsetWorkOrdersRouter from "./alset-work-orders";
import alsetTowingRouter from "./alset-towing";
import alsetRentalsRouter from "./alset-rentals";
import alsetDashboardRouter from "./alset-dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(appointmentsRouter);
router.use(testimonialsRouter);
router.use(contactRouter);
router.use(alsetAuthRouter);
router.use(alsetVehiclesRouter);
router.use(alsetClaimsRouter);
router.use(alsetWorkOrdersRouter);
router.use(alsetTowingRouter);
router.use(alsetRentalsRouter);
router.use(alsetDashboardRouter);

export default router;
