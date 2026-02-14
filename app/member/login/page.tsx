"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Zap, Mail, Lock, Hash, ArrowRight } from "lucide-react";

export default function MemberLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");

    const gymId = typeof window !== "undefined" ? localStorage.getItem("memberGymId") : null;

    const handleEmailPasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please enter email and password");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/member-portal/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, gymId }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Login failed");
                return;
            }

            localStorage.setItem("memberToken", data.token);
            localStorage.setItem("memberData", JSON.stringify(data.member));
            toast.success("SYSTEM ACCESS GRANTED");
            router.push("/member/dashboard");
        } catch (error) {
            toast.error("Critical login failure");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !pin) {
            toast.error("Please enter email and PIN");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/member-portal/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, pin, gymId }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Login failed");
                return;
            }

            localStorage.setItem("memberToken", data.token);
            localStorage.setItem("memberData", JSON.stringify(data.member));
            toast.success("PIN ACCESS GRANTED");
            router.push("/member/dashboard");
        } catch (error) {
            toast.error("PIN validation error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden selection:bg-primary selection:text-black">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,rgba(76,255,0,0.1),transparent_70%)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10 transition-all duration-500">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 neon-glow">
                        <Zap className="w-10 h-10 text-black" />
                    </div>
                    <h2 className="text-4xl font-black italic text-white mb-2 uppercase tracking-tighter">
                        MEMBER <span className="text-primary">PORTAL</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Enter the arena</p>
                </div>

                <div className="glass-card p-1">
                    <Tabs defaultValue="password" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-white/5 border-b border-white/10 rounded-t-xl overflow-hidden p-0 h-14">
                            <TabsTrigger 
                                value="password" 
                                className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-none font-black italic text-xs uppercase tracking-widest transition-all h-full"
                            >
                                PASSWORD
                            </TabsTrigger>
                            <TabsTrigger 
                                value="pin" 
                                className="data-[state=active]:bg-primary data-[state=active]:text-black rounded-none font-black italic text-xs uppercase tracking-widest transition-all h-full"
                            >
                                FAST PIN
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-8">
                            <TabsContent value="password" m-0>
                                <form onSubmit={handleEmailPasswordLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="ACCESS@GYMFLOW.COM"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-12 bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</Label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-12 bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        type="submit" 
                                        className="w-full bg-primary text-black hover:bg-white py-6 h-auto font-black italic text-lg rounded-xl neon-glow transition-all" 
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "SYNCING..." : "ENTER SYSTEM"}
                                        {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="pin">
                                <form onSubmit={handlePinLogin} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="pin-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="pin-email"
                                                type="email"
                                                placeholder="ACCESS@GYMFLOW.COM"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-12 bg-white/5 border-white/10 text-white font-bold h-12 rounded-xl focus:bg-white/10 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="pin" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tactical PIN</Label>
                                        <div className="relative group">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                id="pin"
                                                type="password"
                                                placeholder="••••"
                                                maxLength={6}
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                                className="pl-12 bg-white/5 border-white/10 text-white font-bold text-2xl tracking-[0.5em] h-14 rounded-xl focus:bg-white/10 text-center transition-all"
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        type="submit" 
                                        className="w-full bg-primary text-black hover:bg-white py-6 h-auto font-black italic text-lg rounded-xl neon-glow transition-all" 
                                        disabled={isLoading}
                                    >
                                        {isLoading ? "VALIDATING..." : "PIN AUTHENTICATION"}
                                        {!isLoading && <ArrowRight className="ml-2 w-5 h-5" />}
                                    </Button>
                                </form>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Issues with Access? <br />
                        <a href="#" className="text-primary hover:text-white transition-colors">Contact Command Center</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
