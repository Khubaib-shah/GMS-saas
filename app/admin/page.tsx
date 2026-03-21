"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Plus, Building2, Users, Phone, MapPin, Mail, Lock, CheckCircle2, XCircle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [gyms, setGyms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [deleteGymId, setDeleteGymId] = useState<string | null>(null)
  const [deleteGymName, setDeleteGymName] = useState<string>("")

  const [formData, setFormData] = useState({
    gymName: "",
    gymAddress: "",
    gymPhone: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
  })

  useEffect(() => {
    if (status === "unauthenticated" || (session?.user as any)?.role !== "super_admin") {
      router.push("/dashboard")
      return
    }
    fetchGyms()
  }, [status, session])

  const fetchGyms = async () => {
    try {
      const res = await fetch("/api/admin/gyms")
      const data = await res.json()
      setGyms(data)
    } catch (error) {
      toast.error("Failed to fetch gyms")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegisterGym = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitLoading(true)
    try {
      const res = await fetch("/api/admin/gyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to register gym")
      }

      toast.success("Gym and Owner registered successfully")
      setOpen(false)
      setFormData({
        gymName: "",
        gymAddress: "",
        gymPhone: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
      })
      fetchGyms()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const handleTogglePremium = async (gymId: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/gyms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: gymId, isPremium: !currentStatus }),
      })

      if (!res.ok) throw new Error("Failed to update premium status")

      toast.success(`Premium status updated`)
      fetchGyms()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDeleteGym = async () => {
    console.log(deleteGymId)
    if (!deleteGymId) return

    try {
      toast.loading("Deleting gym and all associated data...", { id: "delete-gym" })

      const res = await fetch(`/api/admin/gyms?id=${deleteGymId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to delete gym")
      }

      toast.success("Gym and all associated data deleted successfully", { id: "delete-gym" })
      setDeleteGymId(null)
      setDeleteGymName("")
      fetchGyms()
    } catch (error: any) {
      toast.error(error.message, { id: "delete-gym" })
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase mb-2">Gym Registry</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Manage SaaS tenants and their owners</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-3 bg-primary text-primary-foreground hover:bg-foreground hover:text-background font-black italic uppercase tracking-wider h-12 px-6 rounded-xl transition-all neon-glow">
              <Plus className="w-5 h-5" />
              Register New Gym
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleRegisterGym}>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-foreground">Register Gym</DialogTitle>
                <DialogDescription className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
                  Create a new gym tenant and its initial owner account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gymName">Gym Name</Label>
                    <Input
                      id="gymName"
                      required
                      value={formData.gymName}
                      onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                      placeholder="Empire Fitness"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gymPhone">Gym Phone</Label>
                    <Input
                      id="gymPhone"
                      value={formData.gymPhone}
                      onChange={(e) => setFormData({ ...formData, gymPhone: e.target.value })}
                      placeholder="+1 234 567 890"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gymAddress">Address</Label>
                  <Input
                    id="gymAddress"
                    value={formData.gymAddress}
                    onChange={(e) => setFormData({ ...formData, gymAddress: e.target.value })}
                    placeholder="123 Street Name, City"
                  />
                </div>

                <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-semibold mb-3">Owner Details</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Full Name</Label>
                      <Input
                        id="ownerName"
                        required
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ownerEmail">Email</Label>
                        <Input
                          id="ownerEmail"
                          type="email"
                          required
                          value={formData.ownerEmail}
                          onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                          placeholder="owner@gym.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ownerPassword">Password</Label>
                        <Input
                          id="ownerPassword"
                          type="password"
                          required
                          value={formData.ownerPassword}
                          onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitLoading}>
                  {isSubmitLoading ? "Registering..." : "Register Gym"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="glass-premium overflow-hidden border-border bg-card dark:bg-slate-950/40">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-border">
              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic py-4">Gym Name</TableHead>
              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic py-4">Contact</TableHead>
              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic py-4">Address</TableHead>
              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic py-4">Plan</TableHead>
              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic py-4">Status</TableHead>
              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic py-4">Registered</TableHead>
              <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gyms.length > 0 ? (
              gyms.map((gym) => (
                <TableRow key={gym._id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 rounded-lg">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{gym.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {gym.phone || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-[200px] truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {gym.address || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePremium(gym._id, gym.isPremium)}
                      className={cn(
                        "gap-2",
                        gym.isPremium ? "text-amber-500 hover:text-amber-600" : "text-slate-400 hover:text-slate-500"
                      )}
                    >
                      {gym.isPremium ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {gym.isPremium ? "Premium" : "Standard"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider">
                      {gym.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(gym.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-black italic uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 rounded-lg"
                        onClick={() => router.push(`/subscriptions?gymId=${gym._id}`)}
                      >
                        Manage Plans
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => {
                          setDeleteGymId(gym._id)
                          setDeleteGymName(gym.name)
                        }}
                        title="Delete Gym"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No gyms registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteGymId !== null} onOpenChange={(open) => !open && setDeleteGymId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Gym: {deleteGymName}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">
                ⚠️ This action cannot be undone!
              </p>
              <p>
                This will permanently delete <strong>{deleteGymName}</strong> and <strong>ALL</strong> associated data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>All members and their profiles</li>
                <li>All subscriptions and payment records</li>
                <li>All membership plans</li>
                <li>All attendance records</li>
                <li>All staff users</li>
                <li>All audit logs</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteGymId(null)
              setDeleteGymName("")
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGym}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
