"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, ChevronDown, CreditCard, UserPlus, AlertTriangle, Menu, X, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { daysUntilExpiry } from "@/lib/utils/file-utils"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const { data: session } = useSession()
  const store = useAppStore()
  const gymName = store.gymProfile.name
  const isAdmin = (session?.user as any)?.role === "super_admin"

  const userName = session?.user?.name || "User"
  const userRole = (session?.user as any)?.role || "Staff"
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  // Derive notifications
  const notifications: { id: string, title: string, message: string, icon: React.ReactNode, color: string, memberId?: string }[] = []

  // 1. Check for expiries
  if (Array.isArray(store.subscriptions)) {
    store.subscriptions.forEach(sub => {
      const daysLeft = daysUntilExpiry(sub.endDate)
      if (daysLeft > 0 && daysLeft <= 7) {
        const member = store.members?.find(m => m.id === sub.memberId)
        notifications.push({
          id: `expiry-${sub.id}`,
          title: "Subscription Expiring",
          message: `${member?.firstName || 'A member'}'s plan ends in ${daysLeft} days.`,
          icon: <AlertTriangle className="w-3 h-3 text-amber-500" />,
          color: "border-amber-500",
          memberId: sub.memberId
        })
      }
    })
  }

  // 2. Check for recent payments (last 24h)
  if (Array.isArray(store.payments)) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    store.payments.forEach(pay => {
      if (new Date(pay.date) > oneDayAgo) {
        notifications.push({
          id: `payment-${pay.id}`,
          title: "Payment Received",
          message: `Received ${pay.amount} PKR.`,
          icon: <CreditCard className="w-3 h-3 text-emerald-500" />,
          color: "border-emerald-500",
          memberId: pay.memberId
        })
      }
    })
  }

  // 3. New Members (last 24h)
  if (Array.isArray(store.members)) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    store.members.forEach(m => {
      // @ts-ignore - createdAt comes from mongoose
      if (m.createdAt && new Date(m.createdAt) > oneDayAgo) {
        notifications.push({
          id: `member-${m.id}`,
          title: "New Registration",
          message: `${m.firstName} ${m.lastName} joined the gym.`,
          icon: <UserPlus className="w-3 h-3 text-blue-500" />,
          color: "border-blue-500",
          memberId: m.id
        })
      }
    })
  }

  const hasNotifications = notifications.length > 0

  // Filter out dismissed
  const activeNotifications = notifications.filter(n => !store.dismissedNotifications.includes(n.id))
  const finalHasNotifications = activeNotifications.length > 0

  const sidebarCollapsed = store.sidebarCollapsed
  const setSidebarCollapsed = store.setSidebarCollapsed

  return (
    <header className={cn(
      "fixed top-0 right-0 h-16 glass border-b border-white/5 flex items-center justify-between px-6 z-40 transition-all duration-300 ease-in-out",
      sidebarCollapsed ? "left-20" : "left-64"
    )}>
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 neon-glow">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">{gymName}</span>
          </div>
        )}
        {/* Search Bar - Subtler */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
            <Input
              placeholder="SEARCH SYSTEM..."
              className="pl-10 h-10 bg-white/5 border-transparent focus:bg-white/10 focus:border-primary/50 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 w-[200px] lg:w-[300px] rounded-xl"
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative h-10 w-10 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
          >
            <Bell className="w-5 h-5" />
            {hasNotifications && finalHasNotifications && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-slate-950 animate-bounce"></span>
            )}
          </Button>

          {notificationsOpen && (
            <div className="absolute right-0 top-14 w-80 glass border border-white/10 rounded-2xl shadow-2xl p-0 z-50 card-enter overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xs text-white tracking-widest uppercase">System Alerts</h3>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Tactical Overlook</p>
                </div>
                {finalHasNotifications && (
                  <button
                    onClick={() => store.clearNotifications(activeNotifications.map(n => n.id))}
                    className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map(note => (
                    <div
                      key={note.id}
                      className={cn(
                        "group/note relative p-3 hover:bg-white/10 rounded-xl cursor-pointer transition-all border border-white/5",
                        "bg-white/5"
                      )}
                      onClick={() => {
                        if (note.memberId) {
                          router.push(`/members/${note.memberId}`)
                          setNotificationsOpen(false)
                        }
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          store.dismissNotification(note.id)
                        }}
                        className="absolute right-2 top-2 p-1 rounded-lg opacity-0 group-hover/note:opacity-100 hover:bg-white/10 transition-all"
                      >
                        <X className="w-3 h-3 text-slate-500 hover:text-white" />
                      </button>
                      <div className="flex items-center gap-2 mb-2 pr-6">
                        <div className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-primary group-hover/note:neon-glow transition-all">
                          {note.icon}
                        </div>
                        <p className="text-xs font-black text-white leading-none tracking-tight uppercase italic">{note.title}</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed pl-1">{note.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5 group-hover:neon-glow transition-all">
                      <Bell className="w-6 h-6 text-slate-700" />
                    </div>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No Active Alerts</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t border-white/5 bg-white/5 text-center">
                  <button className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest" onClick={() => setNotificationsOpen(false)}>Dismiss Overview</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Divider */}
        <div className="h-8 w-px bg-white/5 mx-3"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all group">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-white uppercase tracking-wider italic leading-none">{userName}</p>
            <p className="text-[9px] text-primary mt-1 uppercase font-black tracking-[0.15em]">{userRole.replace("_", " ")}</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-black font-black text-sm neon-glow group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </header>
  )
}
