"use client";

import type React from "react";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
      } else {
        // Fetch session to check role
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        toast.success('Welcome back!');
        // If a callbackUrl was provided and is not the default dashboard, use it
        if (callbackUrl && callbackUrl !== '/dashboard') {
          router.push(callbackUrl);
        } else if (session?.user?.role === 'super_admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      toast.error('An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center p-12">
        <div className="text-center text-primary-foreground">
          <div className="mb-8 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <Dumbbell className="w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">GymFlow</h1>
          <p className="text-lg opacity-90 mb-8">
            Modern Gym Management Solution
          </p>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/30 flex items-center justify-center">
                ✓
              </div>
              <span>Real-time member tracking</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/30 flex items-center justify-center">
                ✓
              </div>
              <span>Automated subscription management</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-foreground/30 flex items-center justify-center">
                ✓
              </div>
              <span>Comprehensive payment tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>
            <p className="text-muted-foreground">Sign in to your gym account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="owner@gym.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm text-primary hover:text-accent transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-accent py-2 h-10"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 pt-8 border-t border-border">
             <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account? Contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
