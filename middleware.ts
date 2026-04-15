import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  DOCTOR: "/doctor/dashboard",
  NURSE: "/nurse/dashboard",
  PATIENT: "/patient/dashboard",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/patient") ||
    pathname.startsWith("/nurse") ||
    pathname.startsWith("/doctor");

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("sb-auth-token")?.value;

  // No token → send back to login page
  if (!token) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const role = request.cookies.get("sb-user-role")?.value;

  if (role) {
    const wrongRole =
      (pathname.startsWith("/doctor") && role !== "DOCTOR") ||
      (pathname.startsWith("/nurse") && role !== "NURSE") ||
      (pathname.startsWith("/patient") && role !== "PATIENT");

    if (wrongRole) {
      const home = ROLE_HOME[role] || "/";
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/patient/:path*", "/nurse/:path*", "/doctor/:path*"],
};
