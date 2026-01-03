import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard",
    "/members/:path*",
    "/plans/:path*",
    "/subscriptions/:path*",
    "/payments/:path*",
    "/settings/:path*",
    "/((?!login|api/register|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
