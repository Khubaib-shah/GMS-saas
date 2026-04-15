import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(req: NextRequest) {
    const cookies = req.cookies.getAll();
    const sessionCookie = cookies.find(c => c.name.includes('session-token'));

    if (!process.env.NEXTAUTH_SECRET) {
        console.error("CRITICAL: NEXTAUTH_SECRET is not defined in environment variables!");
    }

    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: req.nextUrl.protocol === "https:",
    });

    const isAuth = !!token;
    const isLoginPage = req.nextUrl.pathname.startsWith("/login");
    const isMemberPortal = req.nextUrl.pathname.match(/^\/member($|\/)/) || req.nextUrl.pathname.match(/^\/api\/member-portal($|\/)/);
    const isLandingPage = req.nextUrl.pathname === "/";
    const isSignupPage = req.nextUrl.pathname.startsWith("/signup");
    const isSignupApi = req.nextUrl.pathname.startsWith("/api/auth/signup");
    const isRequestDemoApi = req.nextUrl.pathname === "/api/request-demo";
    const isPlatformPlansApi = req.nextUrl.pathname === "/api/platform/plans";
    const isAdmin = token?.role === "super_admin";

    // Debugging (Remove after fixing)
    console.log("[Proxy Debug]:", { pathname: req.nextUrl.pathname, isAuth, isAdmin, tokenRole: token?.role });

    const isSeedApi = req.nextUrl.pathname.startsWith("/api/seed");

    // 1. Allow landing page, member portal, signup, request demo, platform plans, and seed regardless of NextAuth session
    if (isLandingPage || isMemberPortal || isRequestDemoApi || isSignupPage || isSignupApi || isPlatformPlansApi || isSeedApi) {
        return NextResponse.next();
    }

    // 2. Logged-in user visiting /login -> Redirect based on role
    if (isLoginPage) {
        if (isAuth) {
            if (isAdmin) {
                return NextResponse.redirect(new URL("/super-admin", req.url));
            }
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }
        return NextResponse.next();
    }

    // 3. Protect other routes (staff dashboard, admin pages, etc.)
    if (!isAuth) {
        let from = req.nextUrl.pathname;
        if (req.nextUrl.search) {
            from += req.nextUrl.search;
        }
        console.log("[Proxy Redirect]: No token found, sending to login from", from);
        return NextResponse.redirect(
            new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url)
        );
    }

    // 4. Super admin visiting /dashboard or legacy /admin -> Redirect to /super-admin
    if ((req.nextUrl.pathname.startsWith("/dashboard") || req.nextUrl.pathname.startsWith("/admin")) && isAdmin) {
        return NextResponse.redirect(new URL("/super-admin", req.url));
    }
    
    // 5. Redirect any /admin request to /super-admin for platform admins or dashboard for others
    if (req.nextUrl.pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL(isAdmin ? "/super-admin" : "/dashboard", req.url));
    }

    // 5. Regular user visiting /super-admin -> Redirect to /dashboard
    if (req.nextUrl.pathname.startsWith("/super-admin") && !isAdmin) {
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
         * - public assets (png, svg, jpg, etc.)
         */
        "/((?!api/seed|api/register|api/auth|api/request-demo|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
    ],
};
