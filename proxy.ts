import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserForProxy } from "@/lib/supabase/proxy";

// Rotas que exigem autenticação base
const PROTECTED = ["/perfil", "/conquistas", "/assinatura", "/aulas", "/stories", "/ebooks", "/quizzes"];

// Rotas exclusivas de admin
const ADMIN_ONLY = ["/admin"];

// Rotas apenas para não-autenticados
const AUTH_ROUTES = ["/login", "/cadastro", "/esqueci-senha", "/nova-senha"];

function redirectWithSessionCookies(url: URL | string, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { user, response } = await getUserForProxy(request);
  const isAuthenticated = Boolean(user);
  const isAdmin = user?.app_metadata?.role === "admin";

  // Redireciona /blog para o blog externo (conforme regra anterior)
  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    return NextResponse.redirect("https://blogmarcelopsiquiatra.com.br/");
  }

  // Rota admin sem role admin → redireciona para home (ou login se não logado)
  if (ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return redirectWithSessionCookies(loginUrl, response);
    }
    if (!isAdmin) {
      return redirectWithSessionCookies(new URL("/", request.url), response);
    }
  }

  // Rota protegida sem sessão → redireciona para login
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (pathname === "/" && !isAuthenticated) {
    return redirectWithSessionCookies(new URL("/login", request.url), response);
  }
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return redirectWithSessionCookies(loginUrl, response);
  }

  // Redireciona autenticados de rotas de auth (login, etc)
  if (AUTH_ROUTES.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return redirectWithSessionCookies(new URL("/", request.url), response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|noise.png).*)",
  ],
};
