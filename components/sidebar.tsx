"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Dumbbell, ShieldCheck, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

import { useAppStore } from "@/lib/store"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const gymName = useAppStore((state) => state.gymProfile.name)
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed)
  const isAdmin = (session?.user as any)?.role === "super_admin"

  const navItems: NavItem[] = isAdmin 
    ? [
        { label: "Gym Registry", href: "/admin", icon: <Building2 className="w-5 h-5" /> },
        { label: "Plans", href: "/subscriptions", icon: <CreditCard className="w-5 h-5" /> },
        { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
      ]
    : [
        { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
        { label: "Members", href: "/members", icon: <Users className="w-5 h-5" /> },
        { label: "Subscriptions", href: "/subscriptions", icon: <CreditCard className="w-5 h-5" /> },
        { label: "Payments", href: "/payments", icon: <CreditCard className="w-5 h-5" /> },
        { label: "Settings", href: "/settings", icon: <Settings className="w-5 h-5" /> },
      ]

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out",
      sidebarCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo Section */}
      <div className={cn("h-16 flex items-center border-b border-sidebar-border", sidebarCollapsed ? "justify-center px-0" : "px-6")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 group cursor-pointer">
            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-foreground text-background flex items-center justify-center group-hover:bg-primary/90 transition-colors">
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-lg tracking-tight truncate max-w-[150px] animate-in fade-in slide-in-from-left-2 duration-300">
                {isAdmin ? "SaaS Admin" : gymName}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        {!sidebarCollapsed && (
          <p className="px-2 text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-widest animate-in fade-in duration-300">
            {isAdmin ? "Administration" : "Menu"}
          </p>
        )}
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    sidebarCollapsed && "justify-center px-0",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-sidebar-primary" : "text-muted-foreground/70 group-hover:text-foreground"
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
      <div className="p-4 border-t border-sidebar-border">
        <button
          onClick={() => {
            signOut({ callbackUrl: "/login" })
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer group",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span className="animate-in fade-in duration-300">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
