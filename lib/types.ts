export type Member = {
  id: string
  firstName: string
  lastName?: string
  phone?: string
  email?: string
  gender?: "male" | "female" | "other"
  joinDate: string // ISO
  photoBase64?: string | null
  planId?: string
  notes?: string
  gymId?: string
  trainerId?: string
  branchId?: string // Multi-branch support
  workoutPlanId?: string
  lastCheckIn?: string | null
  createdAt?: string // ISO
  deletedAt?: string | null // Soft delete
}

export type Plan = {
  id: string
  mongoId?: string
  name: string
  price: number
  duration: number // days
  description?: string
  gymId?: string
}

export type Subscription = {
  id: string
  mongoId?: string
  memberId: string
  planId: string
  startDate: string // ISO
  endDate: string // ISO
  status: "active" | "expired" | "paused"
  paymentId?: string
  gymId?: string
  // Pause/freeze support (Phase 2)
  pauseHistory?: Array<{
    startDate: string
    endDate?: string
    reason?: string
  }>
  totalPausedDays?: number
  originalEndDate?: string
  currentPauseStart?: string // ISO
}

export type Payment = {
  id: string
  memberId: string
  amount: number
  date: string // ISO
  method: "cash" | "online" | "bank_transfer" | "card" | "other"
  description?: string
  receiptUrl?: string | null
  gymId?: string
  branchId?: string // Multi-branch support
  receiptNumber?: string
  collectedBy?: string // Staff user ID
  notes?: string
  deletedAt?: string | null // Soft delete
}

export type Branch = {
  _id: string
  name: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
  isDefault: boolean
}

export type Role = "owner" | "manager" | "trainer" | "receptionist" | "accountant"

export type User = {
  id: string
  fullName: string
  email: string
  role: Role | "super_admin" | "gym_owner" | "staff"
  gymId?: string
  branchId?: string
  isActive: boolean
  customPermissions?: string[]
}

export type AuditLogEntry = {
  id: string
  gymId: string
  userId: string
  userName?: string
  action: string
  resource: string
  resourceId?: string
  resourceName?: string
  details?: Record<string, any>
  createdAt: string
  ipAddress?: string
  userAgent?: string
}

export type BusinessSettings = {
  taxPercentage: number
  joiningFee: number
  autoExpireDays: number
  gracePeriodDays: number
}
