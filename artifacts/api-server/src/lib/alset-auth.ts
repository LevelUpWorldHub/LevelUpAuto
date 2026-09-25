import crypto from "crypto";

export type AlsetRole =
  | "owner"
  | "shop"
  | "insurer"
  | "towing"
  | "rental"
  | "admin";

export interface AlsetSession {
  userId: number;
  role: AlsetRole;
}

const LEGACY_DEMO_PASSWORD = "demo123";
const LEGACY_DEMO_PASSWORD_HASH =
  "178dc0437010df070293ea9bd2ef50922d85fe94cc7466fac40fc7545dcae1ee";
const PASSWORD_HASH_PREFIX = "scrypt";
const PASSWORD_KEY_LENGTH = 64;
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function getTokenSecret(): string {
  const secret = process.env.ALSET_AUTH_SECRET ?? process.env.DATABASE_URL;

  if (!secret) {
    throw new Error(
      "ALSET_AUTH_SECRET or DATABASE_URL must be set to sign Alset auth tokens.",
    );
  }

  return secret;
}

function timingSafeEqualText(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function signTokenPayload(encodedPayload: string): string {
  return base64UrlEncode(
    crypto.createHmac("sha256", getTokenSecret()).update(encodedPayload).digest(),
  );
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, PASSWORD_KEY_LENGTH)
    .toString("hex");

  return `${PASSWORD_HASH_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (storedHash.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    const [, salt, expectedHash] = storedHash.split("$");

    if (!salt || !expectedHash) {
      return false;
    }

    const derivedKey = crypto
      .scryptSync(password, salt, PASSWORD_KEY_LENGTH)
      .toString("hex");

    return timingSafeEqualText(expectedHash, derivedKey);
  }

  return (
    timingSafeEqualText(storedHash, LEGACY_DEMO_PASSWORD_HASH) &&
    timingSafeEqualText(password, LEGACY_DEMO_PASSWORD)
  );
}

export function passwordNeedsRehash(storedHash: string): boolean {
  return !storedHash.startsWith(`${PASSWORD_HASH_PREFIX}$`);
}

export function makeToken(userId: number, role: AlsetRole): string {
  const payload = {
    userId,
    role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signTokenPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): AlsetSession | null {
  const [encodedPayload, signature, ...rest] = token.split(".");

  if (!encodedPayload || !signature || rest.length > 0) {
    return null;
  }

  const expectedSignature = signTokenPayload(encodedPayload);

  if (!timingSafeEqualText(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    );

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.userId !== "number" ||
      !Number.isInteger(payload.userId) ||
      payload.userId <= 0 ||
      typeof payload.role !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Date.now()
    ) {
      return null;
    }

    if (
      !["owner", "shop", "insurer", "towing", "rental", "admin"].includes(
        payload.role,
      )
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      role: payload.role as AlsetRole,
    };
  } catch {
    return null;
  }
}

export function getRequestUser(req: {
  headers: { authorization?: string | string[] };
}): AlsetSession | null {
  const authHeader = req.headers.authorization;
  const bearerToken =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

  if (!bearerToken) {
    return null;
  }

  return verifyToken(bearerToken);
}
