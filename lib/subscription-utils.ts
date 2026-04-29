export function isSubscriptionActive(endDate: string | Date, status?: string, gracePeriodDays: number = 0): boolean {
  if (status === "paused") return false;
  if (status === "expired" && gracePeriodDays === 0) return false;
  if (status === "cancelled") return false;

  const end = new Date(endDate);
  const now = new Date();

  // If we have a grace period, the subscription is active until (endDate + gracePeriodDays)
  if (gracePeriodDays > 0) {
    const graceEnd = new Date(end);
    graceEnd.setDate(graceEnd.getDate() + gracePeriodDays);
    return graceEnd > now;
  }

  return end > now;
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
