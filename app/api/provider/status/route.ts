import { checkCursorAvailability } from "@/lib/cursor-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = checkCursorAvailability();
  return Response.json(status);
}
