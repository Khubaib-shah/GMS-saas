"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Mail, Edit2, Users, Calendar, Award, DollarSign, Clock, BarChart3, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/utils/file-utils";
import Link from "next/link";
import { TrainerScheduleBoard } from "@/components/trainer-schedule-board";
import { AvailabilityManager } from "@/components/availability-manager";
import { BookingModal } from "@/components/booking-modal";

interface TrainerDetail {
  _id: string;
  fullName: string;
  email: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  experienceYears?: number;
  hourlyRate?: number;
  maxMembersPerSlot?: number;
  trainerStatus?: string;
  photo?: string;
  createdAt: string;
  members: any[];
}

interface Metrics {
  sessionsCount: number;
  noShowCount: number;
  attendanceRate: number;
  utilizationRate: number;
  totalCapacity: number;
  totalBooked: number;
}

export default function TrainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [trainer, setTrainer] = useState<TrainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [availabilities, setAvailabilities] = useState([]);
  
  // Booking state
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    bio: "",
    specialties: "",
    certifications: "",
    experienceYears: 0,
    hourlyRate: 0,
    maxMembersPerSlot: 1,
    photo: "",
  });

  const userRole = (session?.user as any)?.role;
  const userId = (session?.user as any)?.id;
  const canManage = hasPermission(userRole, PERMISSIONS.STAFF_MANAGE);
  const isSelf = userId === id;
  const canEdit = canManage || isSelf;

  useEffect(() => {
    fetchTrainer();
    fetchMetrics();
    fetchAvailability();
  }, [id]);

  const fetchTrainer = async () => {
    try {
      const res = await fetch(`/api/trainers/${id}`);
      if (!res.ok) throw new Error("Failed to fetch trainer");
      const data = await res.json();
      setTrainer(data);
      setFormData({
        fullName: data.fullName || "",
        email: data.email || "",
        password: "",
        bio: data.bio || "",
        specialties: data.specialties?.join(", ") || "",
        certifications: data.certifications?.join(", ") || "",
        experienceYears: data.experienceYears || 0,
        hourlyRate: data.hourlyRate || 0,
        maxMembersPerSlot: data.maxMembersPerSlot || 1,
        photo: data.photo || "",
      });
    } catch (error) {
      toast.error("Error loading trainer details");
      router.push("/trainers");
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`/api/trainers/metrics?trainerId=${id}`);
      if (res.ok) setMetrics(await res.json());
    } catch (error) {}
  };

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`/api/trainers/availability?trainerId=${id}`);
      if (res.ok) {
        setAvailabilities(await res.json());
        setRefreshKey(prev => prev + 1); // Trigger schedule board refresh
      }
    } catch (error) {}
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`/api/trainers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          specialties: formData.specialties.split(",").map(s => s.trim()).filter(s => s),
          certifications: formData.certifications.split(",").map(s => s.trim()).filter(s => s),
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchTrainer();
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const executePasswordReset = async () => {
    try {
      const res = await fetch(`/api/trainers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "password123" }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      toast.success("Password has been reset to 'password123'");
      // Clear the local state if it was typed
      setFormData(prev => ({ ...prev, password: "" }));
      setIsResetModalOpen(false);
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  if (!loading && !trainer) return <div className="p-8 text-center">Trainer not found</div>;

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push("/trainers")} className="-ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trainers
        </Button>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => setIsResetModalOpen(true)}>
              Reset Password
            </Button>
          )}
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
               <div className="mx-auto mb-4 relative">
                  {loading ? (
                      <Skeleton className="w-32 h-32 rounded-full mx-auto" />
                  ) : (
                      <Avatar className="w-32 h-32 border-4 border-background shadow-md">
                          <AvatarImage src={trainer?.photo} alt={trainer?.fullName} className="object-cover" />
                          <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                          {trainer?.fullName?.split(" ").map((n) => n[0]).join("").toUpperCase()}
                          </AvatarFallback>
                      </Avatar>
                  )}
                  <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4" variant={trainer?.trainerStatus === 'active' ? 'default' : 'secondary'}>
                    {loading ? <Skeleton className="w-10 h-3 bg-white/20" /> : (trainer?.trainerStatus || 'active')}
                  </Badge>
              </div>
              <CardTitle className="text-2xl">{loading ? <Skeleton className="h-6 w-40 mx-auto" /> : trainer?.fullName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{loading ? <Skeleton className="h-4 w-32 mx-auto" /> : trainer?.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-muted/50 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Experience</p>
                    <p className="font-bold">{loading ? <Skeleton className="h-5 w-12 mx-auto mt-1.5" /> : `${trainer?.experienceYears || 0} Years`}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Hourly Rate</p>
                    <p className="font-bold text-primary">{loading ? <Skeleton className="h-5 w-12 mx-auto mt-1.5" /> : `$${trainer?.hourlyRate || 0}`}</p>
                  </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Active Clients</span>
                    <span className="font-bold">{loading ? <Skeleton className="h-4 w-6" /> : (trainer?.members?.length || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Max Per Slot</span>
                    <span className="font-bold">{loading ? <Skeleton className="h-4 w-6" /> : (trainer?.maxMembersPerSlot || 1)}</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                      <Award className="w-3 h-3 text-primary" /> Specialties
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-5 w-16" />)
                    ) : (
                        trainer?.specialties?.map((s, i) => <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>)
                    )}
                  </div>
                </div>
                {(loading || trainer?.certifications?.length) ? (
                  <div>
                    <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                        <Award className="w-3 h-3 text-amber-500" /> Certifications
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {loading ? (
                          Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-5 w-20" />)
                      ) : (
                          trainer?.certifications?.map((c, i) => <Badge key={i} variant="outline" className="text-[10px] border-amber-200 text-amber-700 bg-amber-50">{c}</Badge>)
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {metrics && (
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Attendance Rate</span>
                        <span>{metrics.attendanceRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all" style={{ width: `${metrics.attendanceRate}%` }} />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Utilization</span>
                        <span>{metrics.utilizationRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${metrics.utilizationRate}%` }} />
                      </div>
                   </div>
                </CardContent>
              </Card>
          ) || null}
        </div>

        <div className="lg:col-span-3">
          {isEditing ? (
            <Card className="border-none shadow-xl">
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your professional biography and scheduling details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name"
                    validateType="text"
                    value={formData.fullName}
                    onChange={(val) => setFormData({ ...formData, fullName: val })}
                  />
                  <InputField
                    label="Email Address"
                    validateType="email"
                    value={formData.email}
                    onChange={(val) => setFormData({ ...formData, email: val })}
                  />
                  <InputField
                    label="New Password (optional)"
                    type="password"
                    validateType="password"
                    value={formData.password}
                    onChange={(val) => setFormData({ ...formData, password: val })}
                  />
                  <InputField
                    label="Years of Experience"
                    validateType="number"
                    value={formData.experienceYears.toString()}
                    onChange={(val) => setFormData({ ...formData, experienceYears: Number(val) })}
                  />
                  <InputField
                    label="Hourly Rate ($)"
                    validateType="number"
                    value={formData.hourlyRate.toString()}
                    onChange={(val) => setFormData({ ...formData, hourlyRate: Number(val) })}
                  />
                  <InputField
                    label="Max Members / Slot"
                    validateType="number"
                    value={formData.maxMembersPerSlot.toString()}
                    onChange={(val) => setFormData({ ...formData, maxMembersPerSlot: Number(val) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} />
                </div>
                <InputField
                  label="Specialties (comma separated)"
                  validateType="text"
                  value={formData.specialties}
                  onChange={(val) => setFormData({ ...formData, specialties: val })}
                />
                <InputField
                  label="Certifications (comma separated)"
                  validateType="text"
                  value={formData.certifications}
                  onChange={(val) => setFormData({ ...formData, certifications: val })}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleUpdate}><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="schedule" className="space-y-6">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="schedule" className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Schedule</TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Availability</TabsTrigger>
                <TabsTrigger value="clients" className="flex items-center gap-2"><Users className="w-4 h-4" /> Clients</TabsTrigger>
                <TabsTrigger value="bio">About</TabsTrigger>
              </TabsList>
              
              <TabsContent value="schedule" className="space-y-4">
                <TrainerScheduleBoard 
                    key={refreshKey}
                    trainerId={id} 
                    canManage={canManage} 
                    onBookSlot={(slot) => {
                        setSelectedSlot(slot);
                        setIsBookingOpen(true);
                    }}
                />
              </TabsContent>

              <TabsContent value="availability">
                <AvailabilityManager 
                    trainerId={id} 
                    availabilities={availabilities} 
                    onRefresh={fetchAvailability} 
                />
              </TabsContent>

              <TabsContent value="clients">
                <Card className="border-none shadow-lg">
                    <CardHeader>
                        <CardTitle>My Clients</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : (trainer?.members?.length || 0) > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trainer?.members?.map((m: { _id: string; firstName: string; lastName: string }) => (
                                        <TableRow key={m._id}>
                                            <TableCell className="font-medium underline decoration-primary/20">
                                                <Link href={`/members/${m._id}`}>{m.firstName} {m.lastName}</Link>
                                            </TableCell>
                                            <TableCell><Badge variant="outline">Active</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild><Link href={`/members/${m._id}`}>Profile</Link></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">No clients assigned yet.</div>
                        )}
                    </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bio">
                <Card className="border-none shadow-lg">
                    <CardHeader><CardTitle>Biography</CardTitle></CardHeader>
                    <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                        {loading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-[90%]" />
                                <Skeleton className="h-4 w-[80%]" />
                            </div>
                        ) : trainer?.bio ? <p className="leading-relaxed text-muted-foreground">{trainer.bio}</p> : <p className="italic text-muted-foreground">No biography provided.</p>}
                    </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        slot={selectedSlot} 
        onSuccess={() => {
            fetchMetrics();
            fetchTrainer(); // To refresh client list/slots if needed
        }} 
      />

      <ConfirmationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={executePasswordReset}
        title="Reset Trainer Password"
        description={<>Are you sure you want to reset this trainer's password? The new password will be hardcoded to <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">password123</span>.</>}
        confirmText="Confirm Reset"
      />
    </div>
  );
}
