export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isSubscriptionActive(endDate: string, status?: string): boolean {
  if (status === "paused") return false;
  return new Date(endDate) > new Date()
}

export function daysUntilExpiry(endDate: string): number {
  const now = new Date()
  const end = new Date(endDate)
  const diff = end.getTime() - now.getTime()
  console.log(Math.ceil(diff / (1000 * 60 * 60 * 24)))
  return Math.ceil(diff / (1000 * 60 * 60 * 24))

}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
