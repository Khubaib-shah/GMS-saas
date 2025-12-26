import { create } from "zustand"
import { persist } from "zustand/middleware"
// import { localDb } from "./localDb"
import type { Member, Plan, Subscription, Payment } from "./types"

// ... (imports)

// -------------------------
// STATE TYPES
// -------------------------
export type AppState = {
  // Gym Profile
  gymProfile: {
    name: string
    owner: string
    phone: string
    address: string
  }
  loadGymProfile: () => Promise<void>
  updateGymProfile: (data: Partial<AppState["gymProfile"]>) => void

  // Members
  members: Member[]
  loadMembers: () => Promise<void>
  addMember: (data: Omit<Member, "id">) => Promise<Member>
  updateMember: (id: string, data: Partial<Member>) => Promise<void>
  deleteMember: (id: string) => Promise<void>

  // Plans
  plans: Plan[]
  loadPlans: () => Promise<void>
  loadPayments: () => Promise<void>
  updatePlan: (id: string, data: Partial<Plan>) => Promise<void>
  deletePlan: (id: string) => Promise<void>
  addPlan: (data: Plan) => Promise<void>

  // Subscriptions
  subscriptions: Subscription[]
  loadSubscriptions: () => Promise<void>
  renewSubscription: (memberId: string, planId: string, days: number, method?: "cash" | "online", receiptUrl?: string | null) => Promise<boolean>
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>
  deleteSubscription: (id: string) => Promise<void>

  // Payments
  payments: Payment[]
  addPayment: (data: Omit<Payment, "id">) => void
  updatePayment: (id: string, data: Partial<Payment>) => Promise<void>
  deletePayment: (id: string) => Promise<void>

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Sidebar
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void

  // Notifications
  dismissedNotifications: string[]
  dismissNotification: (id: string) => void
  clearNotifications: (ids: string[]) => void
}

// -------------------------
// STORE IMPLEMENTATION
// -------------------------
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // -------------------------
      // GYM PROFILE
      // -------------------------
      gymProfile: {
        name: "GymFlow",
        owner: "Gym Manager",
        phone: "+1-234-567-8900",
        address: "123 Fitness St, Gym City, State 12345",
      },
      updateGymProfile: (data) =>
        set((state) => ({ gymProfile: { ...state.gymProfile, ...data } })),

      loadGymProfile: async () => {
        try {
          const res = await fetch("/api/gym");
          if (res.ok) {
            const data = await res.json();
            set({
              gymProfile: {
                name: data.name || "GymFlow",
                owner: data.owner || "Owner", // Fallback, usually from session
                phone: data.phone || "",
                address: data.address || "",
              },
            });
          }
        } catch (error) {
          console.error("Failed to load gym profile", error);
        }
      },

      // -------------------------
      // MEMBERS
      // -------------------------
      members: [],

      loadMembers: async () => {
        try {
          const res = await fetch("/api/members");
          const data = await res.json();
          if (Array.isArray(data)) {
            set({ members: data });
          } else {
            set({ members: [] });
          }
        } catch (error) {
          console.error("Failed to load members", error);
          set({ members: [] });
        }
      },

      addMember: async (data) => {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const newMember = await res.json();
        if (newMember && newMember.id) {
          set((state) => ({
            members: [newMember, ...state.members],
          }));
        }
        return newMember;
      },

      updateMember: async (id, data) => {
        await fetch(`/api/members/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        // Optimistic update
        set((state) => ({
          members: state.members.map((m) => (m.id === id ? { ...m, ...data } : m)),
        }));
      },

      deleteMember: async (id) => {
        await fetch(`/api/members/${id}`, { method: "DELETE" });
        set((state) => ({
          members: state.members.filter((m) => m.id !== id),
        }));
      },

      // -------------------------
      // PLANS
      // -------------------------
      plans: [],

      loadPlans: async () => {
        try {
          const res = await fetch("/api/plans");
          const data = await res.json();
          if (Array.isArray(data)) {
            set({ plans: data });
          } else {
            set({ plans: [] });
          }
        } catch (error) {
          console.error("Failed to load plans", error);
          set({ plans: [] });
        }
      },

      updatePlan: async (id, data) => {
        try {
          const res = await fetch(`/api/plans/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error("Failed to update plan");

          set((state) => ({
            plans: state.plans.map((p) => (p.id === id ? { ...p, ...data } : p)),
          }));
        } catch (error) {
          console.error("Failed to update plan", error);
        }
      },

      addPlan: async (data) => {
        try {
          const res = await fetch("/api/plans", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!res.ok) {
            const errorData = await res.json();
            const errorMsg = errorData.error ? `${errorData.message}: ${errorData.error}` : (errorData.message || "Failed to add plan");
            throw new Error(errorMsg);
          }

          const newPlan = await res.json();

          if (newPlan && newPlan.id) {
            set((state) => ({
              plans: [...state.plans, newPlan],
            }));
          }
        } catch (error: any) {
          console.error("Failed to add plan:", error.message);
          throw error; // Re-throw so the UI can catch it and show a toast
        }
      },

      deletePlan: async (id) => {
        try {
          const res = await fetch(`/api/plans/${id}`, {
            method: "DELETE",
          });
          if (!res.ok) throw new Error("Failed to delete plan");

          set((state) => ({
            plans: state.plans.filter((p) => p.id !== id),
          }));
        } catch (error) {
          console.error("Failed to delete plan", error);
        }
      },

      // -------------------------
      // SUBSCRIPTIONS
      // -------------------------
      subscriptions: [],

      loadSubscriptions: async () => {
        try {
          const res = await fetch("/api/subscriptions");
          const data = await res.json();
          if (Array.isArray(data)) {
            set({ subscriptions: data });
          } else {
            set({ subscriptions: [] });
          }
        } catch (error) {
          console.error("Failed to load subscriptions", error);
          set({ subscriptions: [] });
        }
      },

      renewSubscription: async (memberId, planId, days, method = "cash", receiptUrl) => {
        const state = get();
        const plan = state.plans.find((p) => p.id === planId);

        // Find latest subscription for this member
        const memberSubs = state.subscriptions.filter(s => s.memberId === memberId);
        const latestSub = memberSubs.length > 0
          ? [...memberSubs].sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0]
          : null;

        let start = new Date();
        if (latestSub && new Date(latestSub.endDate) > start) {
          start = new Date(latestSub.endDate);
        }

        const startDate = start.toISOString();
        const endDate = new Date(
          start.getTime() + (days || plan?.duration || 30) * 86400000,
        ).toISOString();

        try {
          // 1. Create Payment record first if plan exists to get the ID
          let paymentId = undefined;
          if (plan) {
            const payRes = await fetch("/api/payments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                memberId,
                amount: plan.price,
                date: new Date().toISOString(),
                method: method || "cash",
                description: `Renewal: ${plan.name} (Starts ${new Date(startDate).toLocaleDateString()})`,
                receiptUrl: receiptUrl || undefined,
              }),
            });
            if (payRes.ok) {
              const newPayment = await payRes.json();
              paymentId = newPayment.id;
            }
          }

          // 2. Create Subscription with linked paymentId
          const subRes = await fetch("/api/subscriptions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              memberId,
              planId,
              startDate,
              endDate,
              status: "active",
              paymentId,
            }),
          });

          if (!subRes.ok) throw new Error("Failed to create subscription record");
          const newSub = await subRes.json();

          // 3. Update Member's planId
          const memberRes = await fetch(`/api/members/${memberId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId }),
          });
          if (!memberRes.ok) console.error("Failed to update member planId");

          // 4. Update Local State
          set((state) => ({
            subscriptions: [newSub, ...state.subscriptions],
            members: state.members.map(m => m.id === memberId ? { ...m, planId } : m)
          }));

          // Refresh lists from server to be sure
          get().loadMembers();
          get().loadSubscriptions();
          get().loadPayments();

          return true;
        } catch (error) {
          console.error("Failed to renew subscription", error);
          throw error;
        }
      },

      updateSubscription: async (id, data) => {
        try {
          const res = await fetch(`/api/subscriptions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!res.ok) throw new Error("Failed to update subscription");
          const updatedSub = await res.json();

          set((state) => ({
            subscriptions: state.subscriptions.map((s) => (s.id === id ? updatedSub : s)),
          }));
        } catch (error) {
          console.error("Failed to update subscription", error);
        }
      },

      deleteSubscription: async (id) => {
        try {
          const state = get();
          const subToDelete = state.subscriptions.find(s => s.id === id);

          const res = await fetch(`/api/subscriptions/${id}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error("Failed to delete subscription");

          set((state) => ({
            subscriptions: state.subscriptions.filter((s) => s.id !== id),
            // Also remove associated payment from local state if it exists
            payments: subToDelete?.paymentId
              ? state.payments.filter(p => p.id !== subToDelete.paymentId)
              : state.payments
          }));
        } catch (error) {
          console.error("Failed to delete subscription", error);
        }
      },

      // -------------------------
      // PAYMENTS
      // -------------------------
      payments: [],

      loadPayments: async () => {
        try {
          const res = await fetch("/api/payments");
          const data = await res.json();
          if (Array.isArray(data)) {
            set({ payments: data });
          } else {
            set({ payments: [] });
          }
        } catch (error) {
          console.error("Failed to load payments", error);
          set({ payments: [] });
        }
      },

      addPayment: async (data) => {
        try {
          const res = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const newPayment = await res.json();
          if (newPayment && newPayment.id) {
            set((state) => ({
              payments: [newPayment, ...state.payments]
            }));
          }
        } catch (error) {
          console.error("Failed to add payment", error);
        }
      },

      updatePayment: async (id, data) => {
        try {
          const res = await fetch(`/api/payments/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });

          if (!res.ok) throw new Error("Failed to update payment");
          const updatedPayment = await res.json();

          set((state) => ({
            payments: state.payments.map((p) => (p.id === id ? updatedPayment : p)),
          }));
        } catch (error) {
          console.error("Failed to update payment", error);
          throw error;
        }
      },

      deletePayment: async (id) => {
        try {
          const res = await fetch(`/api/payments/${id}`, {
            method: "DELETE",
          });

          if (!res.ok) throw new Error("Failed to delete payment");

          set((state) => ({
            payments: state.payments.filter((p) => p.id !== id),
          }));
        } catch (error) {
          console.error("Failed to delete payment", error);
          throw error;
        }
      },

      // -------------------------
      // SEARCH
      // -------------------------
      searchQuery: "",
      setSearchQuery: (query) => set({ searchQuery: query }),

      // -------------------------
      // SIDEBAR
      // -------------------------
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),

      // -------------------------
      // NOTIFICATIONS
      // -------------------------
      dismissedNotifications: [],
      dismissNotification: (id) => set((state) => ({
        dismissedNotifications: [...state.dismissedNotifications, id]
      })),
      clearNotifications: (ids) => set((state) => ({
        dismissedNotifications: [...state.dismissedNotifications, ...ids]
      })),
    }),
    {
      name: "gym-flow-storage",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        dismissedNotifications: state.dismissedNotifications,
      }),
    }
  ),
)
