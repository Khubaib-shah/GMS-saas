"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { useAppStore } from "@/lib/store"
import { localDb } from "@/lib/localDb"

import { useSession } from "next-auth/react"
import { GuidedTourProvider } from "./guided-tour"
import { GymProvider } from "@/hooks/use-gym-settings"

interface LayoutWrapperProps {
  children: React.ReactNode
}
export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const isAdmin = (session?.user as any)?.role === "super_admin"
  const isLandingPage = pathname === "/"
  const isLoginPage = pathname === "/login"
  const isMemberPortal = pathname?.match(/^\/member($|\/)/)
  const isSuperAdmin = pathname?.startsWith("/super-admin")
  const isLegacyAdmin = pathname?.startsWith("/admin")
  const isSignupPage = pathname?.startsWith("/signup")
  // Only public auth pages and landing page bypass the layout wrapper
  const isPublicPage = isLandingPage || isLoginPage || isSignupPage

  const userRole = (session?.user as any)?.role
  const isMember = userRole === "member"

  const loadGymProfile = useAppStore((state) => state.loadGymProfile)
  const gymName = useAppStore((state) => state.gymProfile.name)

  useEffect(() => {
    // Set document title
    if (gymName && pathname !== "/login") {
      document.title = `${gymName} - GymFlow`
    } else {
      document.title = "GymFlow - Gym Management SaaS"
    }
  }, [gymName, pathname])

  useEffect(() => {
    // Role-based boundary enforcement
    if (session?.user && !isPublicPage) {
      if (userRole === "member" && !pathname.match(/^\/member($|\/)/)) {
        window.location.href = "/member/dashboard";
      } else if (userRole === "super_admin" && !pathname.startsWith("/super-admin")) {
        window.location.href = "/super-admin";
      } else if (userRole !== "member" && userRole !== "super_admin" && (pathname.match(/^\/member($|\/)/) || pathname.startsWith("/super-admin"))) {
        window.location.href = "/dashboard";
      }
    }
  }, [session?.user, pathname, isPublicPage, userRole])

  useEffect(() => {
    // Only load gym profile if authenticated and not on public/landing/auth pages, and not super admin
    if (session?.user && !isPublicPage && userRole !== "super_admin") {
      loadGymProfile()
      // Note: Data collections (members, plans, etc.) are now lazy-loaded by individual pages
      // to improve initial app rendering and dashboard speed.
    }
  }, [session?.user?.id, isPublicPage, userRole, loadGymProfile])

  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)

  return (
    <GymProvider>
      {isPublicPage ? (
        children
      ) : isMember && isMemberPortal ? (
        // Member portal - no sidebar/navbar, just render children
        children
      ) : (
        <GuidedTourProvider>
          <div className="min-h-screen bg-background">
            <Sidebar />
            <Navbar />
            <main className={cn(
              "mt-16 p-2 md:p-8 transition-all duration-300 ease-in-out min-h-[calc(100vh-4rem)]",
              "ml-0 lg:ml-64",
              sidebarCollapsed && "lg:ml-20"
            )}>
              {children}
            </main>
          </div>
        </GuidedTourProvider>
      )}
    </GymProvider>
  )
}

