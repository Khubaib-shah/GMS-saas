"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    Zap,
    User,
    Lock,
    Phone,
    ArrowLeft,
    Save,
    Eye,
    EyeOff,
    CheckCircle2,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MemberSettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form States
    const [profile, setProfile] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: ""
    });

    const [security, setSecurity] = useState({
        password: "",
        confirmPassword: "",
        pin: ""
    });

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem("memberToken");
        if (!token) {
            router.push("/member/login");
            return;
        }

        try {
            const res = await fetch("/api/member-portal/profile", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem("memberToken");
                    router.push("/member/login");
                    return;
                }
                throw new Error("Failed to load profile");
            }

            const data = await res.json();
            setProfile({
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                phone: data.phone || "",
                email: data.email || ""
            });
        } catch (error) {
            toast.error("Failed to load profile");
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem("memberToken");

        try {
            const res = await fetch("/api/member-portal/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone,
                }),
            });

            if (!res.ok) throw new Error("Update failed");

            toast.success("Profile updated successfully");
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSecurityUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (security.password && security.password !== security.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (security.pin && (security.pin.length < 4 || security.pin.length > 6)) {
            toast.error("PIN must be 4-6 digits");
            return;
        }

        setIsSaving(true);
        const token = localStorage.getItem("memberToken");

        try {
            const res = await fetch("/api/member-portal/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    password: security.password || undefined,
                    pin: security.pin || undefined,
                }),
            });

            if (!res.ok) throw new Error("Security update failed");

            toast.success("Security settings updated");
            setSecurity({ password: "", confirmPassword: "", pin: "" });
        } catch (error) {
            toast.error("Failed to update security settings");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Zap className="h-10 w-10 text-primary animate-pulse neon-glow" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary selection:text-primary-foreground">
            {/* Header */}
            <header className="glass border-b border-white/5 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="text-slate-400 hover:text-primary hover:bg-white/5 rounded-xl"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">
                                ACCOUNT <span className="text-primary">SETTINGS</span>
                            </h1>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Manage your profile and security settings</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 pt-10 max-w-2xl">
                <Tabs defaultValue="personal" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/5 p-1 rounded-xl w-full grid grid-cols-2">
                        <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase italic text-xs py-2.5 rounded-lg transition-all tracking-widest leading-none">
                            <User className="w-4 h-4 mr-2" />
                            PERSONAL
                        </TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-black font-black uppercase italic text-xs py-2.5 rounded-lg transition-all tracking-widest leading-none">
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            SECURITY
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="personal" className="space-y-6 outline-none">
                        <form onSubmit={handleProfileUpdate} className="glass border border-white/5 rounded-2xl p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputField
                                    label="First Name"
                                    validateType="name"
                                    value={profile.firstName}
                                    onChange={(val) => setProfile({ ...profile, firstName: val })}
                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-700"
                                />
                                <InputField
                                    label="Last Name"
                                    validateType="name"
                                    value={profile.lastName}
                                    onChange={(val) => setProfile({ ...profile, lastName: val })}
                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-700"
                                />
                            </div>

                            <InputField
                                label="Email Address"
                                validateType="email"
                                value={profile.email}
                                disabled
                                className="bg-white/5 border-white/10 text-slate-500 rounded-xl h-12 font-bold cursor-not-allowed opacity-50"
                                description="Note: Email cannot be changed."
                            />

                            <InputField
                                label="Phone Number"
                                validateType="phone"
                                value={profile.phone}
                                onChange={(val) => setProfile({ ...profile, phone: val })}
                                placeholder="03XX-XXXXXXX"
                                className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-700"
                            />

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-primary text-black hover:bg-white font-black italic uppercase tracking-widest py-6 rounded-xl transition-all shadow-lg shadow-primary/20"
                            >
                                {isSaving ? "SAVING..." : "SAVE PROFILE"}
                                <Save className="ml-2 w-5 h-5" />
                            </Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-6 outline-none">
                        <form onSubmit={handleSecurityUpdate} className="glass border border-white/5 rounded-2xl p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="relative">
                                        <InputField
                                            label="New Password"
                                            validateType="password"
                                            type={showPassword ? "text" : "password"}
                                            value={security.password}
                                            onChange={(val) => setSecurity({ ...security, password: val })}
                                            className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold pr-12 focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-700"
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 bottom-3 text-slate-500 hover:text-primary transition-colors z-10"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                                <InputField
                                    label="Confirm New Password"
                                    validateType="password"
                                    type="password"
                                    value={security.confirmPassword}
                                    onChange={(val) => setSecurity({ ...security, confirmPassword: val })}
                                    className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-700"
                                    placeholder="Repeat new password"
                                />
                            </div>

                            <div className="h-px bg-white/5 my-8" />

                            <InputField
                                label="Login PIN"
                                validateType="number"
                                maxLength={6}
                                value={security.pin}
                                onChange={(val) => setSecurity({ ...security, pin: val })}
                                className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-bold focus-visible:ring-primary focus-visible:border-primary placeholder:text-slate-700"
                                placeholder="4-6 digit numeric PIN"
                                description="Set a PIN for quick login access."
                            />

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-primary text-black hover:bg-white font-black italic uppercase tracking-widest py-6 rounded-xl transition-all shadow-lg shadow-primary/20"
                            >
                                {isSaving ? "SAVING..." : "UPDATE SECURITY"}
                                <Lock className="ml-2 w-5 h-5" />
                            </Button>
                        </form>

                        <div className="glass border border-white/5 rounded-2xl p-6 flex items-start gap-4">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black italic tracking-tight uppercase">Security & Data Protection</h3>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight mt-1">Your personal information is secure and encrypted.</p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
