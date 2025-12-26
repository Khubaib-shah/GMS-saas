"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Building2, Users, Phone, MapPin, Mail, Lock } from "lucide-react"
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

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [gyms, setGyms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [open, setOpen] = useState(false)

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

  if (status === "loading" || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Gym Registry</h1>
          <p className="text-muted-foreground">Manage SaaS tenants and their owners</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Register New Gym
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleRegisterGym}>
              <DialogHeader>
                <DialogTitle>Register New Gym</DialogTitle>
                <DialogDescription>
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

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gym Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered Date</TableHead>
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
                    <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider">
                      {gym.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(gym.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="text-primary hover:text-primary hover:bg-primary/10"
                       onClick={() => router.push(`/subscriptions?gymId=${gym._id}`)}
                     >
                        Manage Plans
                     </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No gyms registered yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
