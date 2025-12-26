import type { Member, Plan, Subscription, Payment } from "./types"

const STORAGE_KEYS = {
  MEMBERS: "gym_app_members_v1",
  PLANS: "gym_app_plans_v1",
  SUBSCRIPTIONS: "gym_app_subscriptions_v1",
  PAYMENTS: "gym_app_payments_v1",
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch (e) {
    console.error("[localDb] read error", e)
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error("[localDb] write error", e)
  }
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Default seed data
const SEED_PLANS: Plan[] = [
  {
    id: "plan_basic",
    name: "Basic",
    price: 2000,
    duration: 30,
    description: "Access to gym floor during business hours",
  },
  {
    id: "plan_standard",
    name: "Standard",
    price: 5000,
    duration: 30,
    description: "All classes + gym floor access",
  },
  {
    id: "plan_premium",
    name: "Premium",
    price: 8000,
    duration: 30,
    description: "Unlimited + personal training sessions",
  },
]

const SEED_MEMBERS: Member[] = [
  {
    id: generateId(),
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1-555-0101",
    gender: "male",
    joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    planId: "plan_premium",
    notes: "VIP member, consistent attendance",
  },
  {
    id: generateId(),
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+1-555-0102",
    gender: "female",
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    planId: "plan_standard",
    notes: "New member, very motivated",
  },
  {
    id: generateId(),
    firstName: "Michael",
    lastName: "Johnson",
    email: "michael.j@example.com",
    phone: "+1-555-0103",
    gender: "male",
    joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    planId: "plan_basic",
    notes: "Subscription expired, follow up needed",
  },
  {
    id: generateId(),
    firstName: "Sarah",
    lastName: "Williams",
    email: "sarah.w@example.com",
    phone: "+1-555-0104",
    gender: "female",
    joinDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    planId: "plan_premium",
    notes: "Cross-fit enthusiast",
  },
  {
    id: generateId(),
    firstName: "Robert",
    lastName: "Brown",
    email: "robert.b@example.com",
    phone: "+1-555-0105",
    gender: "male",
    joinDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    planId: "plan_standard",
    notes: "Regular attendee",
  },
]

export const localDb = {
  // Utility
  seed() {
    console.log("seed error")
    const hasData = read(STORAGE_KEYS.MEMBERS, null) !== null || read(STORAGE_KEYS.PLANS, null) !== null

    console.log("seed done")
    if (hasData) return

    write(STORAGE_KEYS.PLANS, SEED_PLANS)
    write(
      STORAGE_KEYS.MEMBERS,
      SEED_MEMBERS.map((m) => ({
        ...m,
        id: generateId(),
      })),
    )

    // Create subscriptions for all members
    const members = this.getMembers()
    const subscriptions: Subscription[] = members.map((m) => ({
      id: generateId(),
      memberId: m.id,
      planId: m.planId || "plan_basic",
      startDate: m.joinDate,
      endDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    }))
    write(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions)

    // Create some payments
    const payments: Payment[] = members.slice(0, 3).map((m) => ({
      id: generateId(),
      memberId: m.id,
      amount: Math.random() * 100,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      method: ["cash", "card", "transfer"][Math.floor(Math.random() * 3)] as any,
      description: "Monthly subscription",
    }))
    write(STORAGE_KEYS.PAYMENTS, payments)
  },

  reset() {
    localStorage.removeItem(STORAGE_KEYS.MEMBERS)
    localStorage.removeItem(STORAGE_KEYS.PLANS)
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTIONS)
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS)
    this.seed()
  },

  // Members CRUD
  getMembers(): Member[] {
    return read(STORAGE_KEYS.MEMBERS, [])
  },

  saveMembers(members: Member[]) {
    write(STORAGE_KEYS.MEMBERS, members)
  },

  addMember(member: Omit<Member, "id">): Member {
    const newMember: Member = {
      ...member,
      id: generateId(),
      joinDate: new Date().toISOString(),
    }
    const all = this.getMembers()
    all.unshift(newMember)
    this.saveMembers(all)
    return newMember
  },

  getMember(id: string): Member | null {
    return this.getMembers().find((m) => m.id === id) || null
  },

  updateMember(id: string, patch: Partial<Member>) {
    const all = this.getMembers().map((m) => (m.id === id ? { ...m, ...patch } : m))
    this.saveMembers(all)
    return all.find((m) => m.id === id) || null
  },

  deleteMember(id: string) {
    const all = this.getMembers().filter((m) => m.id !== id)
    this.saveMembers(all)
    return true
  },

  // Plans CRUD
  getPlans(): Plan[] {
    return read(STORAGE_KEYS.PLANS, SEED_PLANS)
  },

  savePlans(plans: Plan[]) {
    write(STORAGE_KEYS.PLANS, plans)
  },

  getPlan(id: string): Plan | null {
    return this.getPlans().find((p) => p.id === id) || null
  },

  // Subscriptions CRUD
  getSubscriptions(): Subscription[] {
    return read(STORAGE_KEYS.SUBSCRIPTIONS, [])
  },

  saveSubscriptions(subscriptions: Subscription[]) {
    write(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions)
  },

  getSubscriptionsByMember(memberId: string): Subscription[] {
    return this.getSubscriptions().filter((s) => s.memberId === memberId)
  },

  addSubscription(subscription: Omit<Subscription, "id">): Subscription {
    const newSub: Subscription = {
      ...subscription,
      id: generateId(),
    }
    const all = this.getSubscriptions()
    all.push(newSub)
    this.saveSubscriptions(all)
    return newSub
  },

  updateSubscription(id: string, patch: Partial<Subscription>) {
    const all = this.getSubscriptions().map((s) => (s.id === id ? { ...s, ...patch } : s))
    this.saveSubscriptions(all)
    return all.find((s) => s.id === id) || null
  },

  // Payments CRUD
  getPayments(): Payment[] {
    return read(STORAGE_KEYS.PAYMENTS, [])
  },

  savePayments(payments: Payment[]) {
    write(STORAGE_KEYS.PAYMENTS, payments)
  },

  getPaymentsByMember(memberId: string): Payment[] {
    return this.getPayments().filter((p) => p.memberId === memberId)
  },

  addPayment(payment: Omit<Payment, "id">): Payment {
    const newPayment: Payment = {
      ...payment,
      id: generateId(),
    }
    const all = this.getPayments()
    all.unshift(newPayment)
    this.savePayments(all)
    return newPayment
  },
}
