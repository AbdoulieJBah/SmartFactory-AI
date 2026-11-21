import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_KEY = "smartfactory_token";

const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(TOKEN_KEY)?.value;

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // A cookie may contain an expired token. Let the client verify it with
  // /users/me before redirecting away from login, avoiding a redirect loop.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};