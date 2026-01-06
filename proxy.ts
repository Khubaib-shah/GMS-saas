import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuth = !!token;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isAdmin = token?.role === "super_admin";

  // 1. Logged-in user visiting /login -> Redirect based on role
  if (isLoginPage) {
    if (isAuth) {
      if (isAdmin) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return null;
  }

  // 2. Protect other routes (if not login page, require auth)
  if (!isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url)
    );
  }

  // 3. Super admin visiting /dashboard -> Redirect to /admin
  if (req.nextUrl.pathname.startsWith("/dashboard") && isAdmin) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 4. Regular user visiting /admin -> Redirect to /dashboard
  if (req.nextUrl.pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/register
     * - api/auth
     * - _next/static
     * - _next/image
     * - favicon.ico
     */
    "/((?!api/register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
