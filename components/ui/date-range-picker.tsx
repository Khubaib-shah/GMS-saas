"use client"

import * as React from "react"
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, X, ChevronDown } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  className?: string
  btnClass?: string
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  placeholder?: string
}

const PRESETS = [
  { label: "Today", value: "today", getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "Yesterday", value: "yesterday", getRange: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: "Last 7 Days", value: "last7", getRange: () => ({ from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }) },
  { label: "Last 30 Days", value: "last30", getRange: () => ({ from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }) },
  { label: "This Month", value: "thisMonth", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Month", value: "lastMonth", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "All Time", value: "all", getRange: () => undefined },
]

export function DateRangePicker({
  className,
  date,
  onDateChange,
  btnClass,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [showCalendar, setShowCalendar] = React.useState(false)

  const activePreset = PRESETS.find(p => {
    const range = p.getRange()
    if (!range && !date) return true
    if (!range || !date) return false
    return isSameDay(range.from, date.from as Date) && isSameDay(range.to as Date, date.to as Date)
  })

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const range = preset.getRange()
    onDateChange(range)
    if (preset.value !== "custom") {
      setOpen(false)
      setShowCalendar(false)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "h-11 justify-start text-left font-normal bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all rounded-xl gap-3 min-w-[240px] px-4",
              !date && "text-slate-500",
              date && "text-white border-primary/30 bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]",
              btnClass
            )}
          >
            <CalendarIcon className="w-4 h-4 text-primary" />
            <div className="flex flex-col items-start leading-none gap-1">
             
              {activePreset ? (
                <span className="text-sm font-black italic tracking-tighter uppercase">{activePreset.label}</span>
              ) : date?.from ? (
                <span className="text-sm font-black italic tracking-tighter uppercase">
                  {format(date.from, "MMM dd")} - {date.to ? format(date.to, "MMM dd") : "..."}
                </span>
              ) : (
                <span className="text-sm font-black italic tracking-tighter uppercase">{placeholder}</span>
              )}
            </div>
            <ChevronDown className={cn("ml-auto w-4 h-4 opacity-30 transition-transform", open && "rotate-180")} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 border-white/[0.08] bg-[#0d0d14] shadow-2xl overflow-hidden rounded-2xl flex" 
          align="start"
        >
          {/* Presets List */}
          <div className="w-48 border-r border-white/5 p-2 bg-black/20">
            <div className="px-3 py-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quick Select</span>
            </div>
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all mb-1 flex items-center justify-between group",
                  activePreset?.value === preset.value 
                    ? "bg-primary text-black" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {preset.label}
                {activePreset?.value === preset.value && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
              </button>
            ))}
            <div className="h-px bg-white/5 my-2 mx-2" />
            <button
              onClick={() => setShowCalendar(true)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-between",
                showCalendar || (!activePreset && date)
                  ? "bg-white/10 text-white" 
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              Custom Range
              <CalendarIcon className="w-3 h-3 opacity-50" />
            </button>
          </div>

          {/* Calendar (Conditional) */}
          {(showCalendar || (!activePreset && date)) && (
            <div className="p-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={(newDate) => {
                  onDateChange(newDate)
                  // Don't close immediately to allow range selection
                }}
                numberOfMonths={2}
                className="p-3"
              />
              <div className="p-3 pt-0 flex justify-end gap-2 border-t border-white/5 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCalendar(false)}
                  className="text-[10px] font-black uppercase tracking-widest"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setOpen(false)}
                  className="bg-primary text-black hover:bg-white text-[10px] font-black uppercase tracking-widest px-4"
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
