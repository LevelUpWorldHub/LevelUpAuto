import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, servicesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { CreateAppointmentBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/appointments", async (req, res) => {
  try {
    const results = await db
      .select({
        id: appointmentsTable.id,
        customerName: appointmentsTable.customerName,
        customerEmail: appointmentsTable.customerEmail,
        customerPhone: appointmentsTable.customerPhone,
        serviceId: appointmentsTable.serviceId,
        serviceName: servicesTable.name,
        vehicleMake: appointmentsTable.vehicleMake,
        vehicleModel: appointmentsTable.vehicleModel,
        vehicleYear: appointmentsTable.vehicleYear,
        preferredDate: appointmentsTable.preferredDate,
        notes: appointmentsTable.notes,
        status: appointmentsTable.status,
        createdAt: appointmentsTable.createdAt,
      })
      .from(appointmentsTable)
      .leftJoin(servicesTable, eq(appointmentsTable.serviceId, servicesTable.id))
      .orderBy(appointmentsTable.createdAt);

    const mapped = results.map((r) => ({
      ...r,
      serviceName: r.serviceName ?? "Unknown Service",
      notes: r.notes ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    res.json(mapped);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch appointments");
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
});

router.post("/appointments", async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  try {
    const service = await db
      .select()
      .from(servicesTable)
      .where(eq(servicesTable.id, data.serviceId))
      .limit(1);

    if (service.length === 0) {
      res.status(400).json({ error: "Service not found" });
      return;
    }

    const [created] = await db
      .insert(appointmentsTable)
      .values({
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        serviceId: data.serviceId,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        preferredDate: data.preferredDate,
        notes: data.notes ?? null,
      })
      .returning();

    res.status(201).json({
      id: created.id,
      customerName: created.customerName,
      customerEmail: created.customerEmail,
      customerPhone: created.customerPhone,
      serviceId: created.serviceId,
      serviceName: service[0].name,
      vehicleMake: created.vehicleMake,
      vehicleModel: created.vehicleModel,
      vehicleYear: created.vehicleYear,
      preferredDate: created.preferredDate,
      notes: created.notes ?? null,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create appointment");
    res.status(500).json({ error: "Failed to create appointment" });
  }
});

export default router;
