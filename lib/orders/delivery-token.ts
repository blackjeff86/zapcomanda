import { randomBytes } from "crypto";

export function generateDeliveryToken(): string {
  return randomBytes(24).toString("base64url");
}

export function buildDeliveryUrl(token: string, origin?: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const fromVercel = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;
  const base = fromEnv || origin || fromVercel || "http://localhost:3000";
  return `${base}/entrega/${token}`;
}
