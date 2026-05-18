import { NextRequest, NextResponse } from "next/server";
import { processPendingEmailJobs } from "@/lib/email/resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function hasValidSecret(request: NextRequest) {
  const secret = process.env.EMAIL_JOBS_SECRET ?? process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!hasValidSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createSupabaseAdminClient();
  const result = await processPendingEmailJobs(admin, 25);
  return NextResponse.json({ ok: true, ...result });
}
