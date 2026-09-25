import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { alsetUsersTable, alsetOrganizationsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { AlsetLoginBody } from "@workspace/api-zod";
import {
  getRequestUser,
  hashPassword,
  makeToken,
  passwordNeedsRehash,
  verifyPassword,
} from "../lib/alset-auth";

const router: IRouter = Router();

router.post("/alset/auth/login", async (req, res) => {
  const parsed = AlsetLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(alsetUsersTable)
      .where(eq(alsetUsersTable.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (passwordNeedsRehash(user.passwordHash)) {
      await db
        .update(alsetUsersTable)
        .set({ passwordHash: hashPassword(password) })
        .where(eq(alsetUsersTable.id, user.id));
    }

    let organizationName: string | null = null;
    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(alsetOrganizationsTable)
        .where(eq(alsetOrganizationsTable.id, user.organizationId))
        .limit(1);
      organizationName = org?.name ?? null;
    }

    const token = makeToken(user.id, user.role);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId ?? null,
        organizationName,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/alset/auth/me", async (req, res) => {
  const decoded = getRequestUser(req);

  if (!decoded) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(alsetUsersTable)
      .where(eq(alsetUsersTable.id, decoded.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let organizationName: string | null = null;
    if (user.organizationId) {
      const [org] = await db
        .select()
        .from(alsetOrganizationsTable)
        .where(eq(alsetOrganizationsTable.id, user.organizationId))
        .limit(1);
      organizationName = org?.name ?? null;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId ?? null,
      organizationName,
    });
  } catch (err) {
    req.log.error({ err }, "Get me failed");
    res.status(500).json({ error: "Failed to get user" });
  }
});

export default router;
