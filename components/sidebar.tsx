"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Dumbbell, ShieldCheck, Building2, UserCheck, ClipboardList, Zap, Send, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

import { useAppStore } from "@/lib/store"
import { useFeature, FeatureKey } from "@/hooks/use-feature"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const gymName = useAppStore((state) => state.gymProfile.name)
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const role = (session?.user as any)?.role

  // Feature checks
  const { status: attendanceStatus } = useFeature("attendance")
  const { status: paymentsStatus } = useFeature("payments")
  const { status: trainersStatus } = useFeature("trainers")
  const { status: workoutStatus } = useFeature("workoutPlans")
  const { status: auditStatus } = useFeature("auditLogs")

  const navItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Members", href: "/members", icon: <Users className="w-5 h-5" /> },
    ...(attendanceStatus !== "hidden" && role !== 'trainer' ? [{ label: "Attendance", href: "/attendance", icon: <UserCheck className="w-5 h-5" /> }] : []),
    ...(paymentsStatus !== "hidden" && role !== 'trainer' ? [{ label: "Subscriptions", href: "/subscriptions", icon: <CreditCard className="w-5 h-5" /> }] : []),
    ...(paymentsStatus !== "hidden" && role !== 'trainer' ? [{ label: "Payments", href: "/payments", icon: <CreditCard className="w-5 h-5" /> }] : []),
    ...(workoutStatus !== "hidden" && role === 'trainer' ? [
      { label: "Exercises", href: "/trainer/exercises", icon: <Dumbbell className="w-5 h-5" /> },
      { label: "Templates", href: "/trainer/templates", icon: <ClipboardList className="w-5 h-5" /> },
      { label: "Plan Assignment", href: "/trainer/deploy", icon: <ClipboardList className="w-5 h-5" /> },
    ] : []),
    ...(trainersStatus !== "hidden" ? (
      role === 'trainer' 
        ? [{ label: "My Profile", href: `/trainers/${(session?.user as any)?.id}`, icon: <UserCheck className="w-5 h-5" /> }] 
        : [{ label: "Trainers", href: "/trainers", icon: <UserCheck className="w-5 h-5" /> }]
    ) : []),
    ...(auditStatus !== "hidden" && (role === 'owner' || role === 'gym_owner') ? [{ label: "Audit Logs", href: "/audit-logs", icon: <ClipboardList className="w-5 h-5" /> }] : []),
    { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
  ]

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar backdrop-blur-xl border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out selection:bg-primary selection:text-primary-foreground",
      sidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo Section */}
      <div data-tour="sidebar-logo" className={cn("h-16 flex items-center border-b border-sidebar-border", sidebarCollapsed ? "justify-center px-0" : "px-6")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-2 group cursor-pointer">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-all group-hover:scale-105">
              <Building2 className="w-6 h-6 text-black" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-black text-xl tracking-tighter italic text-white animate-in fade-in slide-in-from-left-2 duration-300">
                GYM<span className="text-primary">FLOW</span>
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation Items */}
      <nav data-tour="sidebar-nav" className="flex-1 px-4 py-8 overflow-y-auto custom-scrollbar">
        {!sidebarCollapsed && (
          <p className="px-3 text-[10px] font-black text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-[0.2em] animate-in fade-in duration-300">
            MANAGEMENT CORE
          </p>
        )}
        <ul className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer group relative overflow-hidden",
                    sidebarCollapsed && "justify-center px-0",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary neon-glow" />
                  )}
                  <span className={cn(
                    "transition-all duration-300 group-hover:scale-110",
                    isActive ? "text-primary neon-text" : "text-slate-500 group-hover:text-primary"
                  )}>
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Logout Section */}
      <div data-tour="sidebar-logout" className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => {
            signOut({ callbackUrl: "/login" })
          }}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 cursor-pointer group",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
          {!sidebarCollapsed && <span className="animate-in fade-in duration-300">LOGOUT</span>}
        </button>
      </div>
    </aside>
  )
}
