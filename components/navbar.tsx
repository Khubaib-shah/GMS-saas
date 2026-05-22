"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, ChevronDown, CreditCard, UserPlus, AlertTriangle, Menu, X, Moon, Sun, Activity } from "lucide-react"
import { InputField } from "@/components/ui/input-field"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { daysUntilExpiry } from "@/lib/utils/file-utils"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings as SettingsIcon, ShieldCheck } from "lucide-react"

export function Navbar() {
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [dbNotifications, setDbNotifications] = useState<any[]>([])
  const { data: session } = useSession()

  useEffect(() => {
    // Only fetch if session exists
    if (session?.user) {
      fetch("/api/notifications")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setDbNotifications(data)
          }
        })
        .catch(console.error)
    }
  }, [session])
  const store = useAppStore()
  const gymName = store.gymProfile.name
  const isAdmin = (session?.user as any)?.role === "super_admin"

  const userName = session?.user?.name || "User"
  const userId = (session?.user as any)?.id // Get current user ID
  const userRole = (session?.user as any)?.role || "Staff"
  const isTrainer = userRole === "trainer"
  const initials = userName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  // Derive notifications
  const notifications: { id: string, title: string, message: string, icon: React.ReactNode, color: string, memberId?: string }[] = []

  // 1. Check for expiries
  if (Array.isArray(store.subscriptions)) {
    store.subscriptions.forEach(sub => {
      const daysLeft = daysUntilExpiry(sub.endDate)
      if (daysLeft > 0 && daysLeft <= 7) {
        const member = store.members?.find(m => m.id === sub.memberId)
        // Trainer filter: only show for their members
        if (isTrainer && member?.trainerId !== userId && (member?.trainerId as any)?._id !== userId) return

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
        const member = store.members?.find(m => m.id === pay.memberId)
        // Trainer filter: only show for their members
        if (isTrainer && member?.trainerId !== userId && (member?.trainerId as any)?._id !== userId) return

        notifications.push({
          id: `payment-${pay.id}`,
          title: "Payment Received",
          message: `Received ${pay.amount} PKR from ${member?.firstName || 'Member'}.`,
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
        // Trainer filter: only show if assigned to THEM
        const isAssignedToTrainer = m.trainerId === userId || (m.trainerId as any)?._id === userId
        if (isTrainer && !isAssignedToTrainer) return

        notifications.push({
          id: `member-${m.id}`,
          title: isTrainer ? "Recently Assigned" : "New Registration",
          message: `${m.firstName} ${m.lastName} ${isTrainer ? 'is now assigned to you.' : 'joined the gym.'}`,
          icon: <UserPlus className="w-3 h-3 text-blue-500" />,
          color: "border-blue-500",
          memberId: m.id
        })
      }
    })
  }

  // 4. Member Check-ins (last 4 hours)
  if (Array.isArray(store.members)) {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)
    store.members.forEach(m => {
      // @ts-ignore - lastCheckIn logic
      if (m.lastCheckIn && new Date(m.lastCheckIn) > fourHoursAgo) {
        // Trainer filter: only show for their members
        if (isTrainer && m.trainerId !== userId && (m.trainerId as any)?._id !== userId) return

        notifications.push({
          id: `checkin-${m.id}-${m.lastCheckIn}`,
          title: "Member Arrived",
          message: `${m.firstName} has just checked in.`,
          icon: <Activity className="w-3 h-3 text-primary" />,
          color: "border-primary",
          memberId: m.id
        })
      }
    })
  }

  const hasNotifications = notifications.length > 0 || dbNotifications.length > 0
  const activeNotifications = notifications.filter(n => !store.dismissedNotifications.includes(n.id))
  
  // Combine local active notifications and DB unread notifications
  const allActiveNotifications = [...activeNotifications, ...dbNotifications.filter(n => !n.isRead)]
  const finalHasNotifications = allActiveNotifications.length > 0

  const sidebarCollapsed = store.sidebarCollapsed
  const setSidebarCollapsed = store.setSidebarCollapsed
  const mobileMenuOpen = store.mobileMenuOpen
  const setMobileMenuOpen = store.setMobileMenuOpen

  // Mark all DB notifications as read
  const handleClearAll = async () => {
    store.clearNotifications(activeNotifications.map(n => n.id))
    try {
      await fetch("/api/notifications/read-all", { method: "POST" })
      setDbNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) {
      console.error(e)
    }
  }

  // Mark single DB notification as read
  const handleReadDbNotification = async (note: any) => {
    if (note.link) {
      router.push(note.link)
    }
    try {
      await fetch(`/api/notifications/${note._id}/read`, { method: "POST" })
      setDbNotifications(prev => prev.map(n => n._id === note._id ? { ...n, isRead: true } : n))
      setNotificationsOpen(false)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <header className={cn(
      "!rounded-none fixed top-0 right-0 h-16 glass-premium border-b border-border flex items-center justify-between px-4 md:px-6 z-40 transition-all duration-300 ease-in-out left-0",
      "lg:left-64",
      sidebarCollapsed && "lg:left-20"
    )}>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Toggle Button - Desktop */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 hidden lg:flex"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Toggle Button - Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl lg:hidden"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 neon-glow overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <span className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest truncate max-w-[80px] md:max-w-none">{gymName}</span>
          </div>
        )}
        {/* Search Bar - Subtler */}
        <div data-tour="navbar-search" className="flex-1 max-w-sm hidden lg:block">
          <InputField
            hideLabel
            validateType="text"
            placeholder="SEARCH DASHBOARD..."
            className="h-10 bg-black/5 dark:bg-white/5 border-transparent focus:bg-black/10 dark:focus:bg-white/10 focus:border-primary/50 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 w-[200px] lg:w-[300px] rounded-xl"
            value={store.searchQuery}
            onChange={(val) => store.setSearchQuery(val)}
            leadingIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center md:gap-2 ml-auto">


        {/* Notifications */}
        <div data-tour="navbar-notifications" className="relative">
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
            <>
              {/* Mobile Overlay to close on click outside */}
              <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="fixed inset-x-4 top-20 md:absolute md:right-0 md:top-14 md:w-80 md:inset-x-auto glass-premium bg-background/100 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-0 z-50 card-enter overflow-hidden">
                <div className="px-5 py-4 border-b border-border bg-secondary/50 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-xs text-foreground tracking-widest uppercase">Notifications</h3>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Operational Activity</p>
                  </div>
                  {finalHasNotifications && (
                    <button
                      onClick={handleClearAll}
                      className="text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div
                  className="max-h-[400px] overflow-y-auto p-3 space-y-2 custom-scrollbar overscroll-contain"
                  data-lenis-prevent
                >
                  {allActiveNotifications.length > 0 ? (
                    allActiveNotifications.map(note => (
                      <div
                        key={note.id || note._id}
                        className={cn(
                          "group/note relative p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl cursor-pointer transition-all border border-black/5 dark:border-white/5",
                          "bg-black/5 dark:bg-white/5"
                        )}
                        onClick={() => {
                          if (note._id) {
                            handleReadDbNotification(note)
                          } else if (note.memberId) {
                            router.push(`/members/${note.memberId}`)
                            setNotificationsOpen(false)
                          }
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (note._id) {
                              handleReadDbNotification(note)
                            } else {
                              store.dismissNotification(note.id)
                            }
                          }}
                          className="absolute right-2 top-2 p-1 rounded-lg opacity-0 group-hover/note:opacity-100 hover:bg-white/10 transition-all"
                        >
                          <X className="w-3 h-3 text-slate-500 hover:text-white" />
                        </button>
                        <div className="flex items-center gap-2 mb-2 pr-6">
                          <div className="p-1.5 rounded-lg bg-secondary border border-border text-primary group-hover/note:neon-glow transition-all">
                            {note.icon || <Bell className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-xs font-black text-foreground leading-none tracking-tight uppercase italic">{note.title}</p>
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
            </>
          )}
        </div>

        {/* User Divider */}
        <div className="hidden md:flex h-8 w-px bg-white/5 mx-3"></div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div data-tour="navbar-profile" className="flex items-center gap-3 pl-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-xl transition-all group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-foreground uppercase tracking-wider leading-none">{userName}</p>
                <p className="text-[9px] text-primary mt-1 uppercase font-black tracking-[0.15em]">{userRole.replace("_", " ")}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-sm neon-glow group-hover:scale-105 transition-transform">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-premium border-border p-2">
            <DropdownMenuLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 py-1.5 italic">
              User Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="rounded-lg text-[10px] font-black uppercase tracking-widest gap-3 py-2.5 focus:bg-primary focus:text-black"
            >
              <User className="w-4 h-4" />
              My Profile
            </DropdownMenuItem>
            {!isTrainer && (
              <DropdownMenuItem
                onClick={() => router.push("/settings")}
                className="rounded-lg text-[10px] font-black uppercase tracking-widest gap-3 py-2.5 focus:bg-primary focus:text-black"
              >
                <SettingsIcon className="w-4 h-4" />
                Gym Configuration
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => router.push("/security")}
              className="rounded-lg text-[10px] font-black uppercase tracking-widest gap-3 py-2.5 focus:bg-primary focus:text-black"
            >
              <ShieldCheck className="w-4 h-4" />
              Security Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/5" />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg text-[10px] font-black uppercase tracking-widest gap-3 py-2.5 focus:bg-red-500 focus:text-white"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
