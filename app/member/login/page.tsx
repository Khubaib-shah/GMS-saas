"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Dumbbell, Mail, Lock, Hash } from "lucide-react";

export default function MemberLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pin, setPin] = useState("");

    // For demo, we'll use a hardcoded gymId. In production, this could come from URL params or subdomain
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

            // Store token and redirect
            localStorage.setItem("memberToken", data.token);
            localStorage.setItem("memberData", JSON.stringify(data.member));
            toast.success("Welcome back!");
            router.push("/member/dashboard");
        } catch (error) {
            toast.error("Login failed. Please try again.");
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
            toast.success("Welcome back!");
            router.push("/member/dashboard");
        } catch (error) {
            toast.error("Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                        <Dumbbell className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Member Portal</CardTitle>
                    <CardDescription>
                        Access your membership details, attendance history, and more
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="password" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="password">Password</TabsTrigger>
                            <TabsTrigger value="pin">PIN</TabsTrigger>
                        </TabsList>

                        <TabsContent value="password">
                            <form onSubmit={handleEmailPasswordLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign In"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="pin">
                            <form onSubmit={handlePinLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pin-email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="pin-email"
                                            type="email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pin">PIN Code</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="pin"
                                            type="password"
                                            placeholder="••••"
                                            maxLength={6}
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? "Signing in..." : "Sign In with PIN"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>Contact your gym to set up portal access</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
