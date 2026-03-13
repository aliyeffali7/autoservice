import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname === "/login") {
    if (session) {
      const redirect = session.user.role === "OWNER" ? "/owner/dashboard" : "/mechanic/dashboard";
      return NextResponse.redirect(new URL(redirect, req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/owner") && session.user.role !== "OWNER") {
    return NextResponse.redirect(new URL("/mechanic/dashboard", req.url));
  }

  if (pathname.startsWith("/mechanic") && session.user.role !== "MECHANIC") {
    return NextResponse.redirect(new URL("/owner/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/owner/:path*", "/mechanic/:path*", "/login"],
};
