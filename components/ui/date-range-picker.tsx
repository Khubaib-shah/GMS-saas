"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
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
  btnClass?: string,
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
  placeholder?: string
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
  btnClass,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "h-10 justify-start text-left font-normal bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all rounded-xl gap-3 min-w-[260px]",
              !date && "text-slate-500",
              date && "text-white border-indigo-500/30 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]",
              btnClass
            )}
          >
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            {date?.from ? (
              date.to ? (
                <span className="text-xs font-bold uppercase tracking-tight">
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </span>
              ) : (
                <span className="text-xs font-bold uppercase tracking-tight">
                  {format(date.from, "LLL dd, y")}
                </span>
              )
            ) : (
              <span className="text-xs font-bold uppercase tracking-tight opacity-60">
                {placeholder}
              </span>
            )}
            {date && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDateChange(undefined);
                }}
                className="ml-auto p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-white/[0.08] bg-[#0d0d14] shadow-2xl overflow-hidden rounded-2xl" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            className="p-4"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
