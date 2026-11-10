import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordError } from "@/lib/app-errors";
import { rateLimit } from "@/lib/rate-limit";
import { requestInfo } from "@/lib/request-info";

/** Browsers report crashes here (ErrorScreen, ErrorReporter). Open to signed-out visitors, so rate-limited per IP. */
export async function POST(req: Request) {
  const { ip, userAgent } = await requestInfo();
  if (!(await rateLimit(`errors:${ip}`, 20, 10 * 60 * 1000)).ok) return new NextResponse(null, { status: 429 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body.message !== "string") return new NextResponse(null, { status: 400 });
  const user = await getCurrentUser().catch(() => null);
  await recordError({ source: "client", message: body.message, stack: body.stack, digest: body.digest, path: body.path, userAgent, userId: user?.id });
  return new NextResponse(null, { status: 204 });
}
