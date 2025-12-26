"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { useAppStore } from "@/lib/store"
import { localDb } from "@/lib/localDb"

import { SessionProvider } from "next-auth/react"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function 



LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const loadMembers = useAppStore((state) => state.loadMembers)
  const loadPlans = useAppStore((state) => state.loadPlans)
  const loadSubscriptions = useAppStore((state) => state.loadSubscriptions)
  const loadPayments = useAppStore((state) => state.loadPayments)
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
    // We only load if not in login page
    if (pathname !== "/login") {
      loadGymProfile()
      loadMembers()
      loadPlans()
      loadSubscriptions()
      loadPayments()
    }
  }, [pathname, loadGymProfile, loadMembers, loadPlans, loadSubscriptions, loadPayments]) 

  const isLoginPage = pathname === "/login"

  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)

  return (
    <SessionProvider>
      {isLoginPage ? (
        children
      ) : (
        <div className="min-h-screen bg-background">
          <Sidebar />
          <Navbar />
          <main className={cn(
            "mt-16 p-8 transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-20" : "ml-64"
          )}>
            {children}
          </main>
        </div>
      )}
    </SessionProvider>
  )
}
