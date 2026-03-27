import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await db
      .select()
      .from(testimonialsTable)
      .orderBy(desc(testimonialsTable.createdAt));

    const result = testimonials.map((t) => ({
      id: t.id,
      customerName: t.customerName,
      rating: t.rating,
      comment: t.comment,
      serviceName: t.serviceName,
      createdAt: t.createdAt.toISOString(),
    }));

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch testimonials");
    res.status(500).json({ error: "Failed to fetch testimonials" });
  }
});

export default router;
