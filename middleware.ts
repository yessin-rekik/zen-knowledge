import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/chat", req.nextUrl));
  }

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/chat/:path*", "/library/:path*", "/admin/:path*", "/login"],
};