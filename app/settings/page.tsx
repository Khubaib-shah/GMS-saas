"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Card } from "@/components/ui/card";
import { Lock, Building2, User, LogOut, Users, Plus, Trash2, Save, UserCheck, Settings2, DollarSign, Bell, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GeneralSettings } from "@/components/settings/GeneralSettings";
import { BusinessSettings } from "@/components/settings/BusinessSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { RoleManagement } from "@/components/settings/RoleManagement";
import { usePermissions } from "@/hooks/use-permissions";
import { DashboardHeader } from "@/components/dashboard-header";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "super_admin";
  const isTrainer = userRole === "trainer";

  // Default tab logic: Trainer -> profile, Super Admin/Owner -> gym
  const getDefaultTab = () => {
    if (isTrainer) return "profile";
    return "gym"; // Default for all other roles including Super Admin
  };

  const [activeTab, setActiveTab] = useState<"gym" | "account" | "staff" | "profile" | "general_settings" | "business_settings" | "notifications" | "roles">(getDefaultTab());
  const { can } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);

  // Staff State
  const [staff, setStaff] = useState<any[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [staffFormData, setStaffFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "receptionist",
  });
  const [gymData, setGymData] = useState({
    name: "",
    address: "",
    phone: "",
  });

  // Trainer Profile State
  const [trainerData, setTrainerData] = useState({
    bio: "",
    specialties: "",
    photo: "",
  });

  useEffect(() => {
    if (activeTab === "gym" && !isAdmin && !isTrainer) {
      fetchGymData();
    } else if (activeTab === "staff") {
      fetchStaff();
    } else if (activeTab === "profile" && isTrainer) {
      fetchTrainerProfile();
    } else {
      setIsLoading(false);
    }
  }, [activeTab, isAdmin, isTrainer]);

  // Initial load check and URL tab sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as any;
    const validTabs = ["gym", "account", "staff", "profile", "general_settings", "business_settings", "notifications", "roles"];

    if (tab && validTabs.includes(tab)) {
      setActiveTab(tab);
    } else {
      setActiveTab(getDefaultTab());
    }
  }, [userRole]);


  const fetchStaff = async () => {
    setIsStaffLoading(true);
    try {
      const res = await fetch("/api/staff");
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setIsStaffLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Staff member added successfully");
      setIsParamsOpen(false);
      setStaffFormData({ fullName: "", email: "", password: "", role: "receptionist" });
      fetchStaff();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteStaff = (id: string) => {
    setStaffToDelete(id);
  };

  const confirmDeleteStaff = async () => {
    if (!staffToDelete) return;
    try {
      const res = await fetch(`/api/staff?id=${staffToDelete}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Staff removed");
        fetchStaff();
      } else {
        throw new Error("Failed to remove");
      }
    } catch (e) {
      toast.error("Error removing staff");
    } finally {
      setStaffToDelete(null);
    }
  };

  const fetchGymData = async () => {
    try {
      const res = await fetch("/api/gym");
      if (res.ok) {
        const data = await res.json();
        setGymData({
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load gym profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGym = async () => {
    try {
      const res = await fetch("/api/gym", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gymData),
      });
      if (res.ok) {
        toast.success("Gym profile updated successfully!");
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      toast.error("Error saving changes");
    }
  };

  const fetchTrainerProfile = async () => {
    try {
      // Use session ID
      const id = (session?.user as any)?.id;
      if (!id) return;
      const res = await fetch(`/api/trainers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTrainerData({
          bio: data.bio || "",
          specialties: data.specialties?.join(", ") || "",
          photo: data.photo || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const id = (session?.user as any)?.id;
      const specialtiesArray = trainerData.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const res = await fetch(`/api/trainers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: trainerData.bio,
          specialties: specialtiesArray,
          photo: trainerData.photo,
        }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  }



  return (
    <div className="animate-fade-up space-y-10">
      <DashboardHeader
        title="ACCOUNT"
        highlight="SETTINGS"
        subtitle="Manage your profile and preferences"
        description="Update your information and settings."
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
        {(isAdmin || (!isAdmin && !isTrainer)) && (
          <button
            onClick={() => setActiveTab("gym")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "gym"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
          >
            <Building2 className="w-4 h-4 inline-block mr-2" />
            Gym Profile
          </button>
        )}

        {isTrainer && (
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "profile"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
          >
            <UserCheck className="w-4 h-4 inline-block mr-2" />
            My Profile
          </button>
        )}

        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "account"
            ? "text-primary border-primary"
            : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
        >
          <User className="w-4 h-4 inline-block mr-2" />
          Account Details
        </button>

        {(isAdmin || (!isAdmin && !isTrainer)) && (
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "staff"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Staff Management
          </button>
        )}

        {/* New: Settings Modules */}
        {(isAdmin || (!isAdmin && !isTrainer && can('settings:view' as any))) && (
          <>
            <button
              onClick={() => setActiveTab("general_settings")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "general_settings"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
            >
              <Settings2 className="w-4 h-4 inline-block mr-2" />
              General
            </button>
            <button
              onClick={() => setActiveTab("business_settings")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "business_settings"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
            >
              <DollarSign className="w-4 h-4 inline-block mr-2" />
              Business
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "notifications"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
                }`}
            >
              <Bell className="w-4 h-4 inline-block mr-2" />
              Notifications
            </button>
          </>
        )}

        {(isAdmin || (!isAdmin && !isTrainer && can('roles:view' as any))) && (
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest italic transition-all whitespace-nowrap ${activeTab === "roles"
              ? "bg-primary text-black neon-glow"
              : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
              }`}
          >
            <Shield className="w-3.5 h-3.5 inline-block mr-2 -mt-0.5" />
            Roles
          </button>
        )}
      </div>

      {/* Gym Profile Tab */}
      {activeTab === "gym" && (
        <Card className="glass-premium p-8 max-w-2xl border-border">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">Gym Profile</h3>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveGym(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Gym Name"
                validateType="text"
                value={gymData.name}
                onChange={(val) =>
                  setGymData({ ...gymData, name: val })
                }
                placeholder="Your Gym Name"
                required
              />
              <InputField
                label="Phone Number"
                validateType="phone"
                value={gymData.phone}
                onChange={(val) =>
                  setGymData({ ...gymData, phone: val })
                }
                placeholder="Phone Number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Address
              </label>
              <textarea
                value={gymData.address}
                onChange={(e) =>
                  setGymData({ ...gymData, address: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-input bg-transparent text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                placeholder="Gym physical address"
              />
            </div>

            <div className="pt-6 border-t border-border">
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Trainer Profile Tab */}
      {activeTab === "profile" && (
        <Card className="glass-premium p-8 max-w-2xl border-border">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">My Profile</h3>
            <div className="h-px flex-1 bg-white/5"></div>
          </div>

          <div className="space-y-8">
            {/* Photo Upload Section */}
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full"></div>
                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Profile Identity</Label>
              </div>
              
              <div className="flex items-center gap-6">
                <label htmlFor="trainer-photo-upload" className="relative group/avatar cursor-pointer">
                  <Avatar className="w-24 h-24 overflow-hidden">
                    <AvatarImage src={trainerData.photo} className="object-cover" />
                    <AvatarFallback className="bg-slate-900 font-black italic text-slate-500">TRAINER</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none rounded-full">
                    <Plus className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                </label>

                <div className="flex-1 space-y-3">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-loose">
                    Update your public presence. <br/>
                    <span className="text-primary/60 italic font-black">Recommended: Square PNG/JPG</span>
                  </p>
                  <label className="group inline-flex items-center h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black italic uppercase tracking-widest text-white hover:bg-primary hover:text-black cursor-pointer transition-all active:scale-95">
                    <Plus className="w-4 h-4 mr-2 transition-transform duration-500 group-hover:rotate-180" />
                    Upload New Photo
                    <input
                    id="trainer-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e: any) => {
                        const file = (e?.target as HTMLInputElement).files?.[0];
                        if (file) {
                          if (file.size > 4 * 1024 * 1024) { 
                            toast.error("Image size too large (max 4MB)");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTrainerData(prev => ({ ...prev, photo: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-3">
              <Label className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                Personal Bio
              </Label>
              <Textarea
                value={trainerData.bio}
                onChange={(e) => setTrainerData({ ...trainerData, bio: e.target.value })}
                rows={4}
                placeholder="Share your experience, philosophy, and background with members..."
                className="bg-white/5 border-white/5 focus:border-primary/50 text-white font-medium italic rounded-2xl p-6 transition-all min-h-[140px]"
              />
            </div>

            {/* Specialties Section */}
            <InputField
              label="Areas of Expertise"
              validateType="text"
              value={trainerData.specialties}
              onChange={(val) => setTrainerData({ ...trainerData, specialties: val })}
              placeholder="e.g. Hypertrophy, Yoga, Powerlifting, Nutrition"
              className="h-12 bg-white/5 border-white/5 font-bold uppercase tracking-tight rounded-xl italic"
            />

            <div className="pt-6 border-t border-white/5">
              <Button 
                onClick={handleUpdateProfile}
                className="h-12 px-10 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter shadow-lg transition-all active:scale-95 group"
              >
                <Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                Save Profile Changes
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4 flex-1">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic flex-shrink-0">Staff Members</h3>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            <Dialog open={isParamsOpen} onOpenChange={setIsParamsOpen}>
              <DialogTrigger asChild>
                <Button className="!h-[38px] px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter neon-glow transition-all group ml-4"><Plus className="w-4 h-4 mr-2" /> Add Staff</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddStaff}>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Create a login for your staff member.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <InputField
                      label="Full Name"
                      validateType="name"
                      required
                      value={staffFormData.fullName}
                      onChange={val => setStaffFormData({ ...staffFormData, fullName: val })}
                      placeholder="Jane Doe"
                    />
                    <InputField
                      label="Email"
                      validateType="email"
                      required
                      type="email"
                      value={staffFormData.email}
                      onChange={val => setStaffFormData({ ...staffFormData, email: val })}
                      placeholder="jane@gymflow.com"
                    />
                    <InputField
                      label="Password"
                      validateType="password"
                      required
                      type="password"
                      value={staffFormData.password}
                      onChange={val => setStaffFormData({ ...staffFormData, password: val })}
                    />
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={staffFormData.role} onValueChange={v => setStaffFormData({ ...staffFormData, role: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(isAdmin || (session?.user as any)?.role === 'owner') && (
                            <SelectItem value="manager">Manager</SelectItem>
                          )}
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                          <SelectItem value="trainer">Trainer</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Account</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="glass-premium p-0 overflow-hidden border-border bg-card dark:bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-bold tracking-widest uppercase">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">Name</th>
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">Email</th>
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">Role</th>
                    <th className="text-left py-6 px-6 font-black text-slate-500 italic">Joined</th>
                    <th className="text-right py-6 px-6 font-black text-slate-500 italic">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">No staff members found.</td>
                    </tr>
                  ) : (
                    staff.map((s) => (
                      <tr key={s.id || s._id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group/row">
                        <td className="py-6 px-6 font-black italic text-foreground tracking-tighter">{s.fullName}</td>
                        <td className="py-6 px-6 font-mono text-slate-400 lowercase">{s.email}</td>
                        <td className="py-6 px-6">
                          <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black italic tracking-widest uppercase">{s.role}</span>
                        </td>
                        <td className="py-6 px-6 text-slate-500 font-mono text-[10px]">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="py-6 px-6 text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-xl border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/row:opacity-100" onClick={() => handleDeleteStaff(s._id || s.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6 animate-fade-in">
          <Card className="glass-premium p-8 max-w-2xl border-border">
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest italic">ACCOUNT INFORMATION</h3>
              <div className="h-px flex-1 bg-white/5"></div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-6 rounded-xl bg-black/20 border border-white/5">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">NAME</p>
                  <p className="font-medium font-black tracking-tighter">{session?.user?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-1">EMAIL</p>
                  <p className="text-slate-400 font-mono text-[11px] mt-1">{session?.user?.email}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-premium p-8 max-w-2xl border-destructive/20 bg-destructive/5">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-sm font-black text-destructive uppercase tracking-widest italic flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                SESSION
              </h3>
              <div className="h-px flex-1 bg-destructive/10"></div>
            </div>
            <p className="text-slate-400 mb-6 text-sm">
              Sign out from your current session and return to the login screen.
            </p>
            <Button
              className="bg-destructive text-white hover:bg-destructive/90 font-black italic tracking-tighter uppercase px-8"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout Account
            </Button>
          </Card>
        </div>
      )}

      {/* New Settings Tabs */}
      {activeTab === "general_settings" && <GeneralSettings />}
      {activeTab === "business_settings" && <BusinessSettings />}
      {activeTab === "notifications" && <NotificationSettings />}
      {activeTab === "roles" && <RoleManagement />}

      <ConfirmationModal
        isOpen={!!staffToDelete}
        onClose={() => setStaffToDelete(null)}
        onConfirm={confirmDeleteStaff}
        title="Remove Staff Member"
        description="Are you sure you want to completely remove this staff member from your gym? Their access will be permanently revoked."
        confirmText="Remove Access"
      />
    </div>
  );
}
