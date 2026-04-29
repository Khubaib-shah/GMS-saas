export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isSubscriptionActive(endDate: string | Date, status?: string, gracePeriodDays: number = 0): boolean {
  if (status === "paused") return false;
  if (status === "expired" && gracePeriodDays === 0) return false;
  if (status === "cancelled") return false;

  const end = new Date(endDate);
  const now = new Date();

  if (gracePeriodDays > 0) {
    const graceEnd = new Date(end);
    graceEnd.setDate(graceEnd.getDate() + gracePeriodDays);
    return graceEnd > now;
  }
  return end > now;
}

export function daysUntilExpiry(endDate: string): number {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))

}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
