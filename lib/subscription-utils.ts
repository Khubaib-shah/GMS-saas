export function isSubscriptionActive(endDate: string | Date, status?: string): boolean {
  if (status === "paused") return false;
  if (status === "expired") return false;
  if (status === "cancelled") return false;
  return new Date(endDate) > new Date();
}

export function daysUntilExpiry(endDate: string | Date): number {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isSubscriptionExpiringSoon(endDate: string | Date, days: number = 7): boolean {
  const remaining = daysUntilExpiry(endDate);
  return remaining > 0 && remaining <= days;
}
