"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface MemberLayoutProps {
  children: React.ReactNode;
}

export default function MemberLayout({ children }: MemberLayoutProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Check if user is a member and has member token
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // If user is logged in through NextAuth but is not a member,
    // they should not be in the /member routes
    if (status === "authenticated" && (session?.user as any)?.role !== "member") {
      // Redirect based on role
      if ((session?.user as any)?.role === "super_admin") {
        router.push("/super-admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  // Only show content if user is a member
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Router will redirect
  }

  if ((session?.user as any)?.role !== "member") {
    return null; // Router will redirect
  }

  return <>{children}</>;
}
