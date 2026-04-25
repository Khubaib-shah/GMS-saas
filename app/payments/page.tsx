"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { InputField } from "@/components/ui/input-field"
import { TrendingUp, DollarSign, AlertCircle, Download, Filter, Search } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatDate, formatCurrency } from "@/lib/utils/file-utils"
import { StatsCard } from "@/components/stats-card"
import { DashboardHeader } from "@/components/dashboard-header"
import { ChartSkeleton } from "@/components/ui/skeleton-components"
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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/components/ui/button"
import { PaginationHUD } from "@/components/ui/pagination-hud"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getPreviousPeriod, calculateTrend, isDateInRange } from "@/lib/analytics-utils"
import { endOfMonth, startOfMonth } from "date-fns"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const PIE_COLORS = ['hsl(var(--primary))', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function PaymentsPage() {
  const store = useAppStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateRange, store.searchQuery])

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
  }, [store.payments, store.members, store.searchQuery, searchTerm, dateRange])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage])

  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {}

    const ascending = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    ascending.forEach(p => {
      const dateObj = new Date(p.date)
      const dateStr = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: !dateRange ? '2-digit' : undefined
      })
      grouped[dateStr] = (grouped[dateStr] || 0) + p.amount
    })

    return Object.keys(grouped).map(date => ({
      date,
      revenue: grouped[date]
    }))
  }, [filtered, dateRange])

  const methodData = useMemo(() => {
    const grouped: Record<string, number> = {}
    filtered.forEach(p => {
      const method = (p.method || 'CASH').toUpperCase()
      grouped[method] = (grouped[method] || 0) + p.amount
    })
    return Object.keys(grouped).map(method => ({
      name: method,
      value: grouped[method]
    })).sort((a, b) => b.value - a.value)
  }, [filtered])

  const topMembersData = useMemo(() => {
    const grouped: Record<string, number> = {}
    filtered.forEach(p => {
      grouped[p.memberId] = (grouped[p.memberId] || 0) + p.amount
    })
    return Object.keys(grouped).map(memberId => {
      const member = store.members.find(m => m.id === memberId)
      return {
        name: member?.firstName ? `${member.firstName} ${member.lastName || ''}`.trim() : 'Unknown',
        amount: grouped[memberId]
      }
    }).sort((a, b) => b.amount - a.amount).slice(0, 5)
  }, [filtered, store.members])

  const totalRevenue = filtered.reduce((sum, p) => sum + p.amount, 0)
  const paidCount = filtered.length
  const avgPayment = paidCount > 0 ? totalRevenue / paidCount : 0

  // Calculate Trends
  const prevRange = dateRange?.from && dateRange?.to ? getPreviousPeriod({ from: dateRange.from, to: dateRange.to }) : null
  const prevPayments = prevRange 
    ? store.payments.filter(p => isDateInRange(p.date, prevRange))
    : []
  
  const prevRevenue = prevPayments.reduce((sum, p) => sum + p.amount, 0)
  const prevCount = prevPayments.length
  const prevAvg = prevCount > 0 ? prevRevenue / prevCount : 0

  const revenueTrend = prevRange ? calculateTrend(totalRevenue, prevRevenue) : undefined
  const countTrend = prevRange ? calculateTrend(paidCount, prevCount) : undefined
  const avgTrend = prevRange ? calculateTrend(avgPayment, prevAvg) : undefined

  const handleExportPDF = () => {
    const doc = new jsPDF()

    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.setTextColor(15, 23, 42)
    doc.text("Payments History", 14, 20)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28)
    
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`, 14, 38)
    doc.text(`Total Transactions: ${paidCount}`, 14, 44)
    doc.text(`Average Payment: ${formatCurrency(avgPayment)}`, 14, 50)

    const tableBody = filtered.map((payment) => {
      const member = store.members.find((m) => m.id === payment.memberId)
      const memberName = member ? `${member.firstName} ${member.lastName || ''}`.trim() : 'Unknown'
      const date = new Date(payment.date).toLocaleDateString()
      return [
        payment.id.split('-')[0].toUpperCase(),
        memberName,
        formatCurrency(payment.amount).replace('₨', 'Rs'),
        date,
        (payment.method || "CASH").toUpperCase()
      ]
    })

    autoTable(doc, {
      startY: 58,
      head: [['ID', 'Member', 'Amount', 'Date', 'Method']],
      body: tableBody,
      theme: 'grid',
      headStyles: { 
        fillColor: [99, 102, 241],
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 5,
        textColor: [15, 23, 42]
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        2: { halign: 'right', fontStyle: 'bold' },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' }
      }
    })

    doc.save(`payments-report-${new Date().getTime()}.pdf`)
  }

  return (
    <div className="space-y-10 animate-fade-up">
      <DashboardHeader
        title="PAYMENT"
        highlight="HISTORY"
        subtitle="Track your gym's income"
        description="View all payments received from members."
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              onClick={handleExportPDF} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF
            </Button>
          </TooltipTrigger>
          <TooltipContent className="font-black italic uppercase tracking-widest text-[9px] bg-card border-border text-foreground">
            Download Payment Report
          </TooltipContent>
        </Tooltip>
      </DashboardHeader>

       {/* Search & Filter HUD */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-8 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 border-r border-white/10 hidden md:flex">
          <Filter className="w-3.5 h-3.5 text-primary/50" />
          <span className="text-[10px] font-black italic tracking-widest text-slate-500 uppercase">
            Filter
          </span>
        </div>

        <div className="flex-1 w-full flex flex-col md:flex-row gap-4">
          <InputField
            hideLabel
            validateType="text"
            placeholder="Search Member..."
            value={searchTerm || store.searchQuery}
            onChange={(val) => {
              setSearchTerm(val)
              store.setSearchQuery(val)
            }}
            leadingIcon={<Search className="w-4 h-4" />}
            className="h-10 bg-transparent border-none hover:bg-white/5 rounded-lg text-[11px] font-bold uppercase italic tracking-wider transition-all focus:border-none focus:ring-0"
            containerClassName="flex-1"
          />

          <div className="h-6 w-px bg-white/5 hidden md:block self-center" />

          <div className="flex items-center gap-4">
            <DateRangePicker
              btnClass="!h-10 border-none bg-transparent hover:bg-white/5 text-[10px] font-black uppercase tracking-widest italic rounded-lg"
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
          trend={revenueTrend}
          isLoading={loading}
        />
        <StatsCard
          title="Total Transactions"
          value={paidCount.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          trend={countTrend}
          isLoading={loading}
        />
        <StatsCard
          title="Average Payment"
          value={formatCurrency(avgPayment)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend={avgTrend}
          isLoading={loading}
        />
      </div>

      {/* add some charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Revenue Area Chart */}
        <div className="glass-premium p-6 border-border lg:col-span-3">
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Revenue Timeline
            </h3>
            <div className="h-px w-full bg-white/5 mt-2"></div>
          </div>
          
          {loading ? (
            <div className="h-[250px] w-full">
              <ChartSkeleton className="h-full border-none bg-transparent p-0" />
            </div>
          ) : chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{ left: -20, right: 12, top: 12, bottom: 12 }}
              >
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value}
                  style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#64748b' }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => value >= 1000 ? `₨${(value/1000).toFixed(1)}k` : `₨${value}`}
                  style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#64748b' }}
                />
                <ChartTooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Area
                  dataKey="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  fillOpacity={1}
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] w-full flex items-center justify-center border border-dashed border-white/5 rounded-xl">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No chart data available</p>
            </div>
          )}
        </div>

        {/* Payment Methods Pie Chart */}
        <div className="glass-premium p-6 border-border lg:col-span-1">
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Methods
            </h3>
            <div className="h-px w-full bg-white/5 mt-2"></div>
          </div>

          {loading ? (
            <div className="h-[250px] w-full">
              <ChartSkeleton className="h-full border-none bg-transparent p-0" />
            </div>
          ) : methodData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={false} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      content={(props) => {
                        const { payload } = props;
                        return (
                          <ul className="flex flex-wrap justify-center gap-4 text-[10px] font-bold tracking-widest uppercase mt-4">
                            {payload?.map((entry, index) => (
                              <li key={`item-${index}`} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-400">{entry.value}</span>
                              </li>
                            ))}
                          </ul>
                        );
                      }}
                    />
                    <Pie
                      data={methodData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {methodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                 </PieChart>
               </ResponsiveContainer>
            </ChartContainer>
          ) : (
             <div className="h-[250px] w-full flex items-center justify-center border border-dashed border-white/5 rounded-xl">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No data</p>
             </div>
          )}
        </div>

        {/* Top Members Bar Chart */}
        <div className="glass-premium p-6 border-border lg:col-span-2">
          <div className="flex flex-col gap-2 mb-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Top 5 Contributors
            </h3>
            <div className="h-px w-full bg-white/5 mt-2"></div>
          </div>

          {loading ? (
            <div className="h-[250px] w-full">
              <ChartSkeleton className="h-full border-none bg-transparent p-0" />
            </div>
          ) : topMembersData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={topMembersData}
                layout="vertical"
                margin={{ left: 24, top: 0, bottom: 0, right: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                   type="number" 
                   tickLine={false} 
                   axisLine={false} 
                   tickFormatter={(value) => value >= 1000 ? `₨${(value/1000).toFixed(1)}k` : `₨${value}`}
                   style={{ fontSize: '10px', fontFamily: 'monospace', fill: '#64748b' }}
                />
                <YAxis 
                   dataKey="name" 
                   type="category" 
                   tickLine={false} 
                   axisLine={false} 
                   tickMargin={8}
                   style={{ fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' }}
                />
                <ChartTooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                   {topMembersData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                   ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] w-full flex items-center justify-center border border-dashed border-white/5 rounded-xl">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No data</p>
            </div>
          )}
        </div>
      </div>

     

      {/* Payments Table */}
      <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
        <div className="overflow-x-auto">
          <Table className="w-full text-[11px] font-bold tracking-widest uppercase border-none">
            <TableHeader className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
              <TableRow className="border-none hover:bg-transparent transition-none">
                <TableHead className="text-left py-6 px-6 font-black text-slate-500 italic">Member</TableHead>
                <TableHead className="text-left py-6 px-6 font-black text-slate-500 italic">Amount</TableHead>
                <TableHead className="text-left py-6 px-6 font-black text-slate-500 italic">Date</TableHead>
                <TableHead className="text-left py-6 px-6 font-black text-slate-500 italic">Method</TableHead>
                <TableHead className="text-left py-6 px-6 font-black text-slate-500 italic">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 8 }).map((_, i) => <TableTdSkeleton key={i} />) : filtered.length > 0 ? (
                paginatedData.map((payment) => {
                  const member = store.members.find((m) => m.id === payment.memberId)
                  return (
                    <TableRow key={payment.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                      <TableCell className="py-6 px-6">
                        <span className="text-foreground font-black italic tracking-tighter text-base block group-hover/row:text-primary transition-colors">
                          {member?.firstName} {member?.lastName || ""}
                        </span>
                      </TableCell>
                      <TableCell className="py-6 px-6 font-black text-primary text-base">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="py-6 px-6 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                        {formatDate(payment.date).toUpperCase()}
                      </TableCell>
                      <TableCell className="py-6 px-6">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[9px] font-black tracking-widest italic group-hover:border-primary/20 transition-all">
                              {payment.method.toUpperCase()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="font-black italic uppercase tracking-widest text-[9px] bg-card border-border text-foreground">
                            Payment Method
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="py-6 px-6 text-slate-500 font-mono text-[9px] lowercase max-w-xs truncate">
                        {payment.description}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-24 text-center hover:bg-transparent">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
                      <DollarSign className="w-8 h-8 text-slate-700" />
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No payments found</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationHUD
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
