"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { InputField } from "@/components/ui/input-field"
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatDate, formatCurrency } from "@/lib/utils/file-utils"
import { StatsCard } from "@/components/stats-card"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableTdSkeleton } from "@/components/table-td-skeleton"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

export default function PaymentsPage() {
  const store = useAppStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPeriod, setFilterPeriod] = useState<"this-month" | "last-month" | "all">("this-month")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        store.loadPayments(),
        store.loadMembers()
      ])
      setLoading(false)
    }
    loadData()
  }, [])

  // ... (filtered useMemo stays same)

  const filtered = useMemo(() => {
    let result = store.payments
    const currentSearch = store.searchQuery || searchTerm

    if (dateRange?.from) {
      const from = new Date(dateRange.from)
      from.setHours(0, 0, 0, 0)
      const to = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from)
      to.setHours(23, 59, 59, 999)

      result = result.filter((p) => {
        const date = new Date(p.date)
        return date >= from && date <= to
      })
    } else if (filterPeriod !== "all") {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      if (filterPeriod === "this-month") {
        result = result.filter((p) => {
          const date = new Date(p.date)
          return date >= startOfMonth && date <= endOfMonth
        })
      } else if (filterPeriod === "last-month") {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
        result = result.filter((p) => {
          const date = new Date(p.date)
          return date >= lastMonthStart && date <= lastMonthEnd
        })
      }
    }

    if (currentSearch) {
      const lower = currentSearch.toLowerCase()
      result = result.filter((p) => {
        const member = store.members.find((m) => m.id === p.memberId)
        const fullName = `${member?.firstName || ""} ${member?.lastName || ""}`
        return fullName.toLowerCase().includes(lower)
      })
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [store.payments, store.members, store.searchQuery, searchTerm, filterPeriod, dateRange])

  const totalRevenue = filtered.reduce((sum, p) => sum + p.amount, 0)
  const paidCount = filtered.length
  const avgPayment = paidCount > 0 ? totalRevenue / paidCount : 0

  return (
    <div className="space-y-10 animate-fade-up">
      <DashboardHeader
        title="PAYMENT"
        highlight="HISTORY"
        subtitle="Track your gym's income"
        description="View all payments received from members."
        descriptionIconColor="emerald"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Transactions"
          value={paidCount.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <StatsCard
          title="Average Payment"
          value={formatCurrency(avgPayment)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* add some charts */}

      {/* Filter - Bento Style */}
      <div className="glass-premium p-8 border-border">
        <div className="flex flex-col sm:flex-row gap-6 items-end">
          <div className="flex-1 w-full sm:w-auto">
            <InputField
              label="Search Member"
              validateType="text"
              placeholder="Searching..."
              value={searchTerm || store.searchQuery}
              onChange={(val) => {
                setSearchTerm(val)
                store.setSearchQuery(val)
              }}
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Custom Range</label>
            <DateRangePicker
              btnClass="!h-12 rounded-md"
              date={dateRange}
              onDateChange={(range) => {
                setDateRange(range);
                if (range) setFilterPeriod("all");
              }}
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Period</label>
            <Select
              value={filterPeriod}
              onValueChange={(value) => {
                setFilterPeriod(value as "this-month" | "last-month" | "all");
                if (value !== "all") setDateRange(undefined);
              }}
            >
              <SelectTrigger className="!h-12 px-6 rounded-md border-transparent bg-black/5 dark:bg-white/5 text-foreground font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10">
                <SelectItem value="this-month" className="text-[10px] font-bold uppercase tracking-widest">This Month</SelectItem>
                <SelectItem value="last-month" className="text-[10px] font-bold uppercase tracking-widest">Last Month</SelectItem>
                <SelectItem value="all" className="text-[10px] font-bold uppercase tracking-widest">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] font-bold tracking-widest uppercase">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">MEMBER</th>
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">AMOUNT</th>
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">DATE</th>
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">METHOD</th>
                <th className="text-left py-6 px-6 font-black text-slate-500 italic">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 3 }).map((_, i) => <TableTdSkeleton key={i} />) : filtered.length > 0 ? (
                filtered.map((payment) => {
                  const member = store.members.find((m) => m.id === payment.memberId)
                  return (
                    <tr key={payment.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                      <td className="py-6 px-6">
                        <span className="text-foreground font-black italic tracking-tighter text-base block group-hover/row:text-primary transition-colors">
                          {member?.firstName} {member?.lastName || ""}
                        </span>
                      </td>
                      <td className="py-6 px-6 font-black text-primary text-base">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-6 px-6 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                        {formatDate(payment.date).toUpperCase()}
                      </td>
                      <td className="py-6 px-6">
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9px] font-black tracking-widest italic group-hover/row:border-primary/20 transition-all">
                          {payment.method.toUpperCase()}
                        </div>
                      </td>
                      <td className="py-6 px-6 text-slate-500 font-mono text-[9px] lowercase max-w-xs truncate">
                        {payment.description}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
                      <DollarSign className="w-8 h-8 text-slate-700" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No payments found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
