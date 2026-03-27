import { Router, type IRouter } from "express";
import healthRouter from "./health";
import servicesRouter from "./services";
import appointmentsRouter from "./appointments";
import testimonialsRouter from "./testimonials";
import contactRouter from "./contact";

const router: IRouter = Router();

router.use(healthRouter);
router.use(servicesRouter);
router.use(appointmentsRouter);
router.use(testimonialsRouter);
router.use(contactRouter);

export default router;
