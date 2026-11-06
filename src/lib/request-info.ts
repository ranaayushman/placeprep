import "server-only";
import { headers } from "next/headers";

/**
 * Client IP and user agent. Behind Caddy/nginx the real IP is the first entry of
 * X-Forwarded-For; only trust it when the app is not directly exposed to the internet.
 */
export async function requestInfo() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || null;
  return { ip, userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}
