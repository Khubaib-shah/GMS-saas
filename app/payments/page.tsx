"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TrendingUp, DollarSign, AlertCircle } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { formatDate, formatCurrency } from "@/lib/utils/file-utils"
import { StatsCard } from "@/components/stats-card"
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

export default function PaymentsPage() {
  const store = useAppStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPeriod, setFilterPeriod] = useState<"this-month" | "last-month" | "all">("this-month")

  useEffect(() => {
    store.loadPayments()
    store.loadMembers()
  }, [])

  const filtered = useMemo(() => {
    let result = store.payments
    const currentSearch = store.searchQuery || searchTerm

    if (filterPeriod !== "all") {
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
  }, [store.payments, store.members, store.searchQuery, searchTerm, filterPeriod])

  const totalRevenue = filtered.reduce((sum, p) => sum + p.amount, 0)
  const paidCount = filtered.length
  const avgPayment = paidCount > 0 ? totalRevenue / paidCount : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Payments</h1>
        <p className="text-muted-foreground">Manage and track all gym payments</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatsCard
          title="Transactions"
          value={paidCount.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <StatsCard
          title="Avg. Payment"
          value={formatCurrency(avgPayment)}
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      {/* Filter */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-sm font-medium text-foreground mb-2">Search by member name</label>
            <Input
              placeholder="Search..."
              value={searchTerm || store.searchQuery}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                store.setSearchQuery(e.target.value)
              }}
              className="bg-background border-input"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-foreground mb-2">Period</label>
            <Select
              value={filterPeriod}
              onValueChange={(value) => setFilterPeriod(value as "this-month" | "last-month" | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((payment) => {
                const member = store.members.find((m) => m.id === payment.memberId)
                return (
                  <TableRow key={payment.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium text-foreground">
                      {member?.firstName} {member?.lastName || ""}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(payment.date)}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">{payment.method}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.description}</TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
