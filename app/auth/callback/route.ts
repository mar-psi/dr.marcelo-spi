import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeRedirect(raw: string | null, origin: string): URL {
  if (!raw) return new URL("/", origin);

  try {
    const url = new URL(raw, origin);
    if (url.origin === origin && url.pathname.startsWith("/")) return url;
  } catch {
    if (raw.startsWith("/") && !raw.startsWith("//")) {
      return new URL(raw, origin);
    }
  }

  return new URL("/", origin);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const redirectTo = getSafeRedirect(next, requestUrl.origin);

  if (!code || !hasSupabaseConfig()) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", "oauth_callback_failed");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(redirectTo);
}
