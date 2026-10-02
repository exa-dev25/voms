import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/unauthorized") {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token ? "/dashboard" : "/login", request.url),
    );
  }

  const protectedPaths = [
    "/dashboard",
    "/drivers",
    "/route-performance",
    "/live-map",
    "/assignment",
    "/profile",
    "/master-data",
    "/settings",
    "/users",
  ];
  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const adminPaths = ["/settings", "/users", "/master-data"];
  const requiresAdmin = adminPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (requiresAdmin && !["ADMIN", "SUPERADMIN"].includes(String(token?.role))) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
