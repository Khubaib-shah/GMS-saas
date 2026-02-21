"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "super_admin";
  const isTrainer = userRole === "trainer";

  // Default tab logic: Admin -> account, Trainer -> profile, Owner -> gym
  const getDefaultTab = () => {
    if (isAdmin) return "account";
    if (isTrainer) return "profile";
    return "gym"; // Owner/Manager default
  };

  const [activeTab, setActiveTab] = useState<"gym" | "account" | "staff" | "profile" | "general_settings" | "business_settings" | "notifications" | "roles">(getDefaultTab());
  const { can } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);

  // Staff State
  const [staff, setStaff] = useState<any[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [isParamsOpen, setIsParamsOpen] = useState(false);
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

  // Initial load check
  useEffect(() => {
    setActiveTab(getDefaultTab());
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

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;
    try {
      const res = await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Staff removed");
        fetchStaff();
      } else {
        throw new Error("Failed to remove");
      }
    } catch (e) {
      toast.error("Error removing staff");
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

  if (isLoading) return <div className="p-8">Loading settings...</div>

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-border flex-wrap">
        {!isAdmin && !isTrainer && (
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

        {!isAdmin && !isTrainer && (
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
        {!isAdmin && !isTrainer && can('settings:view' as any) && (
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

        {!isAdmin && !isTrainer && can('roles:view' as any) && (
          <button
            onClick={() => setActiveTab("roles")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${activeTab === "roles"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
          >
            <Shield className="w-4 h-4 inline-block mr-2" />
            Roles
          </button>
        )}
      </div>

      {/* Gym Profile Tab */}
      {activeTab === "gym" && (
        <Card className="p-8 bg-card max-w-2xl border-border/60 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Gym Profile
          </h2>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveGym(); }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Gym Name
                </label>
                <Input
                  value={gymData.name}
                  onChange={(e) =>
                    setGymData({ ...gymData, name: e.target.value })
                  }
                  placeholder="Your Gym Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <Input
                  value={gymData.phone}
                  onChange={(e) =>
                    setGymData({ ...gymData, phone: e.target.value })
                  }
                  placeholder="Phone Number"
                />
              </div>
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
        <Card className="p-8 bg-card max-w-2xl border-border/60 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Edit Profile</h2>
          <div className="space-y-6">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                {trainerData.photo && (
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={trainerData.photo} />
                    <AvatarFallback>IMG</AvatarFallback>
                  </Avatar>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 4 * 1024 * 1024) { // 4MB limit
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
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">Recommended: Square image, max 4MB.</p>
            </div>

            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea
                value={trainerData.bio}
                onChange={(e) => setTrainerData({ ...trainerData, bio: e.target.value })}
                rows={5}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="space-y-2">
              <Label>Specialties (comma separated)</Label>
              <Input
                value={trainerData.specialties}
                onChange={(e) => setTrainerData({ ...trainerData, specialties: e.target.value })}
                placeholder="Yoga, HIIT, Nutrition"
              />
            </div>

            <div className="pt-6 border-t border-border">
              <Button onClick={handleUpdateProfile}>
                <Save className="w-4 h-4 mr-2" />
                Save Profile
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Staff Tab */}
      {activeTab === "staff" && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Staff Members</h2>
              <p className="text-muted-foreground">Manage access for managers and receptionists.</p>
            </div>
            <Dialog open={isParamsOpen} onOpenChange={setIsParamsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Add Staff</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddStaff}>
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                    <DialogDescription>Create a login for your staff member.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input required value={staffFormData.fullName} onChange={e => setStaffFormData({ ...staffFormData, fullName: e.target.value })} placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input required type="email" value={staffFormData.email} onChange={e => setStaffFormData({ ...staffFormData, email: e.target.value })} placeholder="jane@gymflow.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input required type="password" value={staffFormData.password} onChange={e => setStaffFormData({ ...staffFormData, password: e.target.value })} />
                    </div>
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

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No staff members found.</TableCell>
                  </TableRow>
                ) : (
                  staff.map((s) => (
                    <TableRow key={s.id || s._id}>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <span className="capitalize bg-muted px-2 py-1 rounded text-xs font-semibold">{s.role}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStaff(s._id || s.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Account Tab */}
      {activeTab === "account" && (
        <div className="space-y-6 animate-fade-in">
          <Card className="p-8 bg-card max-w-2xl border-border/60 shadow-sm">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Name</p>
                  <p className="font-medium">{session?.user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Email</p>
                  <p className="font-medium text-foreground">{session?.user?.email}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 bg-card max-w-2xl border-border/60 shadow-sm border-destructive/20">
            <h2 className="text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <LogOut className="w-5 h-5" />
              Session
            </h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Sign out from your current session and return to the login screen.
            </p>
            <Button
              onClick={() => signOut({ callbackUrl: "/login" })}
              variant="destructive"
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
    </div>
  );
}
