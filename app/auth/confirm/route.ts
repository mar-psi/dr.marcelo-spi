import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SUPPORTED_TYPES = new Set<EmailOtpType>([
  "email",
  "recovery",
  "invite",
  "email_change",
]);

function normalizeOtpType(raw: string | null): EmailOtpType | null {
  if (!raw) return null;
  if (raw === "signup" || raw === "magiclink") return "email";
  if (SUPPORTED_TYPES.has(raw as EmailOtpType)) return raw as EmailOtpType;
  return null;
}

function defaultRedirectForType(type: EmailOtpType, origin: string): URL {
  switch (type) {
    case "recovery":
      return new URL("/nova-senha?notice=password_reset_ready", origin);
    case "invite":
      return new URL("/nova-senha?notice=invite_ready", origin);
    case "email_change":
      return new URL("/login?notice=email_changed", origin);
    case "email":
    default:
      return new URL("/login?notice=email_confirmed", origin);
  }
}

function safeRedirect(raw: string | null, origin: string, type: EmailOtpType): URL {
  if (!raw) return defaultRedirectForType(type, origin);

  try {
    const url = new URL(raw, origin);
    if (url.origin === origin && url.pathname.startsWith("/")) return url;
  } catch {
    if (raw.startsWith("/") && !raw.startsWith("//")) {
      return new URL(raw, origin);
    }
  }

  return defaultRedirectForType(type, origin);
}

function errorRedirect(origin: string, type: EmailOtpType | null): URL {
  if (type === "recovery" || type === "invite") {
    return new URL("/esqueci-senha?notice=email_link_invalid", origin);
  }

  return new URL("/login?notice=email_link_invalid", origin);
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = normalizeOtpType(requestUrl.searchParams.get("type"));

  if (!tokenHash || !type || !hasSupabaseConfig()) {
    return NextResponse.redirect(errorRedirect(requestUrl.origin, type));
  }

  const redirectTo = safeRedirect(requestUrl.searchParams.get("next"), requestUrl.origin, type);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return NextResponse.redirect(errorRedirect(requestUrl.origin, type));
  }

  return NextResponse.redirect(redirectTo);
}
