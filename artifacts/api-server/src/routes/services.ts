import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { servicesTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/services", async (req, res) => {
  try {
    const services = await db.select().from(servicesTable).orderBy(servicesTable.id);
    const result = services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: parseFloat(s.price),
      durationMinutes: s.durationMinutes,
      category: s.category,
      imageUrl: s.imageUrl ?? null,
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch services");
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

export default router;
