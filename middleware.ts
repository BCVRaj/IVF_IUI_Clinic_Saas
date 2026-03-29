import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/patient", "/nurse", "/doctor"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // TODO: Replace with real auth/session checks and role validation.
  const isAuthenticated = true;

  if (!isAuthenticated) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/nurse/:path*", "/doctor/:path*"],
};
