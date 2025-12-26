"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, ChevronDown, CreditCard, UserPlus, AlertTriangle, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/lib/store"
import { daysUntilExpiry } from "@/lib/utils/file-utils"
import { cn } from "@/lib/utils"

export function Navbar() {
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
      "fixed top-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-sidebar-border flex items-center justify-between px-6 z-40 transition-all duration-300 ease-in-out",
      sidebarCollapsed ? "left-20" : "left-64"
    )}>
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {!isAdmin && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{gymName}</span>
          </div>
        )}
        {/* Search Bar - Subtler */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 bg-muted/50 border-transparent focus:bg-background focus:border-border transition-all duration-200 w-[200px] lg:w-[300px]"
              value={store.searchQuery}
              onChange={(e) => store.setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-4 h-4" />
          {hasNotifications && finalHasNotifications && (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-destructive rounded-full ring-2 ring-background"></span>
          )}
        </Button>

        {notificationsOpen && (
          <div className="absolute right-0 top-12 w-80 bg-popover border border-border rounded-lg shadow-lg p-0 z-50 card-enter overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
               <div>
                  <h3 className="font-semibold text-sm leading-none mb-1">Action Required</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Real-time alerts</p>
               </div>
               {finalHasNotifications && (
                 <button 
                  onClick={() => store.clearNotifications(activeNotifications.map(n => n.id))}
                  className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-tight"
                 >
                   Clear All
                 </button>
               )}
            </div>
            <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
              {activeNotifications.length > 0 ? (
                activeNotifications.map(note => (
                  <div 
                    key={note.id} 
                    className={`group/note relative p-2.5 hover:bg-muted rounded-md cursor-pointer transition-colors border-l-2 ${note.color} bg-muted/5`}
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
                      className="absolute right-1.5 top-1.5 p-1 rounded-md opacity-0 group-hover/note:opacity-100 hover:bg-muted-foreground/10 transition-all"
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                    <div className="flex items-center gap-2 mb-1 pr-4">
                      {note.icon}
                      <p className="text-xs font-bold text-foreground leading-none">{note.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-5">{note.message}</p>
                  </div>
                ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-muted/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground italic">No pending notifications</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                 <div className="p-2 border-t border-border bg-muted/10 text-center">
                    <button className="text-[10px] font-bold text-primary hover:underline" onClick={() => setNotificationsOpen(false)}>Close</button>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* User Divider */}
        <div className="h-6 w-px bg-border mx-2"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-1 cursor-pointer hover:bg-muted/50 p-1.5 rounded-lg transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize font-medium">{userRole.replace("_", " ")}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-sm ring-2 ring-background">
            {initials}
          </div>
           <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </header>
  )
}
