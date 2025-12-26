"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Lock, Building2, User, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "super_admin";
  const [activeTab, setActiveTab] = useState<"gym" | "account">(isAdmin ? "account" : "gym");
  const [isLoading, setIsLoading] = useState(true);
  const [gymData, setGymData] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!isAdmin) {
      fetchGymData();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

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

  if (isLoading) return <div className="p-8">Loading settings...</div>

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your gym account and preferences
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b border-border flex-wrap">
        {!isAdmin && (
          <button
            onClick={() => setActiveTab("gym")}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "gym"
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4 inline-block mr-2" />
            Gym Profile
          </button>
        )}
        <button
          onClick={() => setActiveTab("account")}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "account"
              ? "text-primary border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          <User className="w-4 h-4 inline-block mr-2" />
          Account Details
        </button>
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
    </div>
  );
}
