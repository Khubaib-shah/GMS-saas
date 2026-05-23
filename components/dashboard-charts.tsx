"use client"

import { Card } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import { useMemo, useState } from "react"
import { formatCurrency } from "@/lib/utils/file-utils"
import { ChartSkeleton, ChartCardSkeleton } from "@/components/ui/skeleton-components"
import { DateRange } from "react-day-picker"
import { isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, format, subDays, differenceInDays } from "date-fns"
import { cn } from "@/lib/utils"

export function RevenueChart({ isLoading, dateRange }: { isLoading?: boolean, dateRange?: DateRange }) {
  if (isLoading) return <ChartCardSkeleton title="Revenue Trend" />

  const store = useAppStore()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const data = useMemo<{ name: string; value: number; date?: Date }[]>(() => {
    const rawData = store.dashboardStats?.charts?.revenueChartData || []
    
    if (dateRange?.from && dateRange?.to) {
      const paymentsByDate = new Map<string, number>()
      rawData.forEach((p: any) => {
        paymentsByDate.set(p._id, p.value)
      })

      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
        .filter(day => day.getDay() !== 0)

      return days.map(day => {
        const dateStr = format(day, "yyyy-MM-dd")
        return {
          name: format(day, "MMM dd"),
          value: paymentsByDate.get(dateStr) || 0,
          date: day
        }
      })
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyTotals = new Array(12).fill(0)

    rawData.forEach((d: any) => {
      const monthIndex = parseInt(d._id) - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyTotals[monthIndex] = d.value
      }
    })

    return months.map((month, index) => ({
      name: month,
      value: monthlyTotals[index],
      date: undefined
    }))
  }, [store.dashboardStats, dateRange])

  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <Card className="p-4 md:p-6 glass-premium border-border h-full flex flex-col overflow-hidden">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-md md:text-lg font-bold md:font-black tracking-tighter text-foreground">Revenue Trend</h3>
          <p className="text-[10px] font-medium md:font-bold text-slate-500 tracking-widest -mt-1">
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
              : `Monthly revenue for ${new Date().getFullYear()}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs md:text-sm font-black uppercase tracking-widest text-primary">Total Revenue</p>
          <p className="text-md md:text-2xl font-black tracking-tighter leading-none -mt-px">
            {formatCurrency(data.reduce((sum, d) => sum + d.value, 0))}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full pb-4 overflow-x-auto scrollbar-hide group/scroll">
        <div
          className="flex items-end justify-between gap-1 h-full pt-8 pb-2"
          style={{ minWidth: data.length > 12 ? `${data.length * 20}px` : "100%" }}
        >
          {data.map((item, i) => {
            const height = (item.value / maxValue) * 100;

            // Weekly legend logic: 1st, 7th, 14th, 21st, 28th
            let showLabel = false;
            if (item.date) {
              const d = item.date.getDate();
              showLabel = d === 1 || d === 7 || d === 14 || d === 21 || d === 28;
            } else {
              showLabel = data.length <= 12 || i === 0 || i === data.length - 1 || i % 5 === 0;
            }

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center h-full justify-end group relative px-1 cursor-pointer"
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
              >
                {/* Column Hover Background */}
                <div className={cn(
                  "absolute inset-x-0 top-0 bottom-8 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg",
                  activeIndex === i && "opacity-100 bg-white/10"
                )} />

                {/* Tooltip */}
                <div className={cn(
                  "absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-white/10 font-bold tracking-tight pointer-events-none",
                  activeIndex === i && "opacity-100 -top-6"
                )}>
                  {formatCurrency(item.value)}
                </div>

                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all relative overflow-hidden",
                    item.value > 0 ? "bg-primary/20 group-hover:bg-primary/40" : "bg-transparent"
                  )}
                  style={{ height: `${item.value > 0 ? Math.max(height, 4) : 0}%` }}
                >
                  {item.value > 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-primary/5 opacity-50" />
                      <div className="absolute bottom-0 left-0 right-0 bg-primary h-[3px] shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    </>
                  )}
                </div>

                {/* Zero Value Indicator */}
                {item.value === 0 && (
                  <div className="w-1 h-1 rounded-full bg-slate-800 mb-2" />
                )}

                <div className="h-6 w-full flex items-center justify-center mt-2 relative">
                  <span className={cn(
                    "text-[9px] whitespace-nowrap text-slate-500 font-black uppercase tracking-widest transition-all duration-300 absolute",
                    "group-hover:text-primary group-hover:opacity-100 group-hover:translate-y-0",
                    (showLabel || activeIndex === i) ? "opacity-100" : "opacity-0 -translate-y-1",
                    activeIndex === i && "text-primary translate-y-0"
                  )}>
                    {item.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  )
}

// ... SubscriptionChart and MembershipStatusChart remain largely same but I'll check for consistency ...

export function SubscriptionChart({ isLoading, dateRange }: { isLoading?: boolean, dateRange?: DateRange }) {
  if (isLoading) return <ChartCardSkeleton title="Subscriptions" type="pie" />

  const store = useAppStore()

  const stats = useMemo<{name: string, value: number, color: string}[]>(() => {
    const rawData = store.dashboardStats?.charts?.subscriptionChartData || []
    const colors = [
      "bg-primary",
      "bg-blue-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-purple-500",
    ]

    return rawData.map((d: any, i: number) => ({
      name: d.name,
      value: d.value,
      color: colors[i % colors.length]
    }))
  }, [store.dashboardStats])

  const total = stats.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <Card className="p-4 md:p-6 glass-premium border-border h-full flex flex-col overflow-hidden">
      <div className="mb-6">
        <h3 className="text-md md:text-lg font-bold md:font-black tracking-tighter text-foreground">Membership Plans</h3>
        <p className="text-[10px] font-medium md:font-bold text-slate-500 tracking-widest -mt-1">
          {dateRange?.from && dateRange?.to
            ? `New plans: ${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
            : "Distribution by plan"}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4 mt-auto">
        <div
          className="relative w-48 h-48 rounded-full flex items-center justify-center group/donut"
          style={{
            background: total > 0
              ? `conic-gradient(${stats.map((stat, i) => {
                const prevValues = stats.slice(0, i).reduce((acc, curr) => acc + curr.value, 0);
                const startPerc = (prevValues / total) * 100;
                const endPerc = ((prevValues + stat.value) / total) * 100;

                let color = '#3b82f6';
                if (stat.color.includes('primary')) color = 'hsl(var(--primary))';
                else if (stat.color.includes('emerald')) color = '#10b981';
                else if (stat.color.includes('amber')) color = '#f59e0b';
                else if (stat.color.includes('rose')) color = '#f43f5e';
                else if (stat.color.includes('purple')) color = '#8b5cf6';
                else if (stat.color.includes('blue')) color = '#3b82f6';

                return `${color} ${startPerc}% ${endPerc}%`;
              }).join(', ')})`
              : 'hsl(var(--muted))'
          }}
        >
          <div className="absolute inset-0 m-[1.2rem] rounded-full bg-[#0e1016dd] flex items-center justify-center shadow-inner">
            <div className="text-center group-hover/donut:scale-110 transition-transform duration-500">
              <span className="text-4xl font-black tracking-tighter block leading-none">{total}</span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 block">Total</span>
            </div>
          </div>
        </div>

        <div className="w-full mt-8 space-y-1.5 md:space-y-3">
          {stats.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">No active subscriptions found.</p>
          )}
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <span className="text-sm font-medium">{stat.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{stat.value} ({total > 0 ? Math.round(stat.value / total * 100) : 0}%)</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function MembershipStatusChart({ isLoading }: { isLoading?: boolean }) {
  if (isLoading) return <ChartCardSkeleton title="Membership Health" type="pie" />

  const store = useAppStore()

  const stats = useMemo<{name: string, value: number, color: string}[]>(() => {
    return store.dashboardStats?.charts?.membershipStatusData || [
      { name: "Active", value: 0, color: "bg-emerald-500" },
      { name: "Expiring Soon", value: 0, color: "bg-amber-500" },
      { name: "Expired", value: 0, color: "bg-rose-500" },
    ]
  }, [store.dashboardStats])

  const total = stats.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <Card className="p-4 md:p-8 glass-premium border-border h-full flex flex-col">
      <div className="mb-4 md:mb-8">
        <h3 className="text-md md:text-lg font-bold md:font-black tracking-tighter text-foreground">Membership Health</h3>
        <p className="text-[10px] font-medium md:font-bold text-slate-500 tracking-widest -mt-1">Current membership statuses</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className="relative w-48 h-48 rounded-full flex items-center justify-center group/donut"
          style={{
            background: total > 0
              ? `conic-gradient(${stats.map((stat, i) => {
                const prevValues = stats.slice(0, i).reduce((acc, curr) => acc + curr.value, 0);
                const startPerc = (prevValues / total) * 100;
                const endPerc = ((prevValues + stat.value) / total) * 100;

                let color = '#3b82f6';
                if (stat.color.includes('emerald')) color = '#10b981';
                else if (stat.color.includes('amber')) color = '#f59e0b';
                else if (stat.color.includes('rose')) color = '#f43f5e';
                else if (stat.color.includes('primary')) color = 'hsl(var(--primary))';

                return `${color} ${startPerc}% ${endPerc}%`;
              }).join(', ')})`
              : 'hsl(var(--muted))'
          }}
        >
          <div className="absolute inset-0 m-[1.2rem] rounded-full bg-[#0e1016dd] flex items-center justify-center shadow-inner">
            <div className="text-center group-hover/donut:scale-110 transition-transform duration-500">
              <span className="text-4xl font-black tracking-tighter block leading-none">{total}</span>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 block">Members</span>
            </div>
          </div>
        </div>

        <div className="w-full mt-10 space-y-2 md:space-y-4">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between group/row md:cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${stat.color} shadow-[0_0_10px_rgba(255,255,255,0.1)] md:group-hover/row:scale-150 transition-transform`} />
                <span className="text-[11px] font-black  tracking-widest uppercase text-slate-400 group-hover:text-foreground transition-colors">{stat.name}</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-foreground group-hover:text-primary transition-colors">
                {stat.value} {total > 0 && `(${Math.round(stat.value / total * 100)}%)`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function AttendanceChart({ isLoading, dateRange }: { isLoading?: boolean, dateRange?: DateRange }) {
  if (isLoading) return <ChartCardSkeleton title="Attendance" />

  const store = useAppStore()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const data = useMemo<{ name: string; value: number; date?: Date }[]>(() => {
    const rawData = store.dashboardStats?.charts?.attendanceChartData || []
    
    if (dateRange?.from && dateRange?.to) {
      // Pre-group attendance by date for O(1) lookup
      const attendanceByDate = new Map<string, number>()
      rawData.forEach((att: any) => {
        attendanceByDate.set(att._id, att.count)
      })

      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
        .filter(day => day.getDay() !== 0) // Remove Sundays

      return days.map(day => {
        const dateStr = format(day, "yyyy-MM-dd")
        return {
          name: format(day, "MMM dd"),
          value: attendanceByDate.get(dateStr) || 0,
          date: day
        }
      })
    }

    const days = []
    const counts = new Array(7).fill(0)
    const now = startOfDay(new Date())

    // Generate labels for last 7 days
    for (let i = 6; i >= 0; i--) {
      days.push(format(subDays(now, i), "EEE"))
    }

    rawData.forEach((att: any) => {
      const [year, month, day] = att._id.split('-')
      const date = startOfDay(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)))
      const diff = differenceInDays(now, date)
      if (diff >= 0 && diff < 7) {
        counts[6 - diff] += att.count
      }
    })

    return days.map((day, i) => ({
      name: day,
      value: counts[i],
      date: undefined
    }))
  }, [store.dashboardStats, dateRange])

  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <Card className="p-4 md:p-6 glass-premium border-border h-full flex flex-col overflow-hidden">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-foreground">Attendance</h3>
          <p className="text-sm text-muted-foreground">
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
              : "Check-ins for the last 7 days"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-500 italic">Total Check-ins</p>
          <p className="text-2xl font-black tracking-tighter leading-none mt-1">
            {data.reduce((sum, d) => sum + d.value, 0)}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[300px] w-full pb-4 overflow-x-auto scrollbar-hide">
        <div
          className="flex items-end justify-between gap-1 h-full pt-8 pb-2"
          style={{ minWidth: data.length > 12 ? `${data.length * 20}px` : "100%" }}
        >
          {data.map((item, i) => {
            const height = (item.value / maxValue) * 100;

            // Weekly legend logic: 1st, 7th, 14th, 21st, 28th
            let showLabel = false;
            if (item.date) {
              const d = item.date.getDate();
              showLabel = d === 1 || d === 7 || d === 14 || d === 21 || d === 28;
            } else {
              showLabel = data.length <= 12 || i === 0 || i === data.length - 1 || i % 5 === 0;
            }

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center h-full justify-end group relative px-1 cursor-pointer"
                onClick={() => setActiveIndex(activeIndex === i ? null : i)}
              >
                {/* Column Hover Background */}
                <div className={cn(
                  "absolute inset-x-0 top-0 bottom-8 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg",
                  activeIndex === i && "opacity-100 bg-white/10"
                )} />

                {/* Tooltip */}
                <div className={cn(
                  "absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-md shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 border border-white/10 font-bold tracking-tight pointer-events-none",
                  activeIndex === i && "opacity-100 -top-6"
                )}>
                  {item.value} Check-ins
                </div>

                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-t-lg transition-all relative overflow-hidden",
                    item.value > 0 ? "bg-emerald-500/20 group-hover:bg-emerald-500/40" : "bg-transparent"
                  )}
                  style={{ height: `${item.value > 0 ? Math.max(height, 4) : 0}%` }}
                >
                  {item.value > 0 && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/40 to-emerald-500/5 opacity-50" />
                      <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 h-[3px] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    </>
                  )}
                </div>

                {/* Zero Value Indicator */}
                {item.value === 0 && (
                  <div className="w-1 h-1 rounded-full bg-slate-800 mb-2" />
                )}

                <div className="h-6 w-full flex items-center justify-center mt-2 relative">
                  <span className={cn(
                    "text-[9px] whitespace-nowrap text-slate-500 font-black uppercase tracking-widest transition-all duration-300 absolute",
                    "group-hover:text-emerald-500 group-hover:opacity-100 group-hover:translate-y-0",
                    (showLabel || activeIndex === i) ? "opacity-100" : "opacity-0 -translate-y-1",
                    activeIndex === i && "text-emerald-500 translate-y-0"
                  )}>
                    {item.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  )
}

