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
}

export type Payment = {
  id: string
  memberId: string
  amount: number
  date: string // ISO
  method: "cash" | "online"
  description?: string
  receiptUrl?: string | null
  gymId?: string
}
