import { differenceInDays, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns"

export type DateRange = {
  from: Date
  to: Date
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const duration = differenceInDays(range.to, range.from) + 1
  return {
    from: subDays(range.from, duration),
    to: subDays(range.from, 1),
  }
}

export function calculateTrend(currentValue: number, previousValue: number) {
  if (previousValue === 0) {
    return { value: currentValue > 0 ? 100 : 0, isPositive: currentValue > 0 }
  }
  const diff = currentValue - previousValue
  const percentage = (diff / previousValue) * 100
  return {
    value: Math.abs(Math.round(percentage)),
    isPositive: diff >= 0
  }
}

export function isDateInRange(date: string | Date, range: DateRange) {
  const d = new Date(date)
  return isWithinInterval(d, {
    start: startOfDay(range.from),
    end: endOfDay(range.to)
  })
}
