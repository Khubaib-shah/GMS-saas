"use client"

import { Card } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"
import { useMemo } from "react"
import { formatCurrency } from "@/lib/utils/file-utils"

export function RevenueChart() {
  const store = useAppStore()
  
  const data = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentYear = new Date().getFullYear()
    
    // Initialize monthly totals
    const monthlyTotals = new Array(12).fill(0)

    store.payments.forEach(payment => {
        const date = new Date(payment.date)
        if (date.getFullYear() === currentYear) {
            monthlyTotals[date.getMonth()] += payment.amount
        }
    })

    return months.map((month, index) => ({
      name: month,
      value: monthlyTotals[index]
    }))
  }, [store.payments])

  const maxValue = Math.max(...data.map(d => d.value), 1) // Prevent division by zero

  return (
    <Card className="p-6 md:col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Revenue Trend</h3>
        <p className="text-sm text-muted-foreground">Monthly revenue for {new Date().getFullYear()}</p>
      </div>
      
      <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-4">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
             <div 
               className="w-full bg-primary/10 rounded-t-sm group-hover:bg-primary/20 transition-all relative"
               style={{ height: `${(item.value / maxValue) * 100}%` }}
             >
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs p-1.5 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-border">
                    {formatCurrency(item.value)}
                </div>
                 {/* Inner bar indicator */}
                <div 
                    className="absolute bottom-0 left-0 right-0 bg-primary w-full opacity-80" 
                    style={{ height: item.value > 0 ? "4px" : "0px" }}
                />
             </div>
             <span className="text-xs text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function SubscriptionChart() {
  const store = useAppStore()
  
  const stats = useMemo(() => {
    const planCounts: Record<string, number> = {}
    
    store.subscriptions.forEach(sub => {
       const plan = store.plans.find(p => p.id === sub.planId)
       const name = plan ? plan.name : "Unknown Plan"
       planCounts[name] = (planCounts[name] || 0) + 1
    })
    
    // No mock data - purely dynamic
    return Object.entries(planCounts).map(([name, value], i) => ({
        name, 
        value,
        color: i === 0 ? "bg-primary" : `bg-primary/${Math.max(10, 80 - (i * 20))}` // Dynamic opacity
    }))
  }, [store.subscriptions, store.plans])

  const total = stats.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Subscriptions</h3>
        <p className="text-sm text-muted-foreground">Distribution by plan</p>
      </div>

      <div className="flex flex-col items-center justify-center py-4">
        {/* Simple CSS Donut representation */}
        <div className="relative w-48 h-48 rounded-full border-[1.5rem] border-muted flex items-center justify-center">
             <div className="text-center">
                <span className="text-3xl font-bold block">{total}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
            </div>
        </div>

        <div className="w-full mt-8 space-y-3">
            {stats.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No active subscriptions found.</p>
            )}
            {stats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                        <span className="text-sm font-medium">{stat.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{stat.value} ({Math.round(stat.value / total * 100)}%)</span>
                </div>
            ))}
        </div>
      </div>
    </Card>
  )
}
