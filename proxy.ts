import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_COOKIE,
  isValidAdminSession,
  isValidSession,
} from "@/lib/auth";

/**
 * Customer and administrator routes use separate session cookies.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (isPublicPath(pathname)) return NextResponse.next();

  if (isAdminPage || isAdminApi) {
    const isAdmin = await isValidAdminSession(
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    );
    if (isAdmin) return NextResponse.next();

    if (isAdminApi) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  const isCustomer = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (isCustomer) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  return NextResponse.redirect(loginUrl);
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/health"
  );
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
