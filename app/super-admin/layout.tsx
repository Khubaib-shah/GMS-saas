"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Receipt,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Shield,
    Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/super-admin", icon: LayoutDashboard },
    { label: "Gyms", href: "/super-admin/gyms", icon: Building2 },
    { label: "Plans", href: "/super-admin/plans", icon: CreditCard },
    { label: "Billing", href: "/super-admin/billing", icon: Receipt },
    { label: "Settings", href: "/super-admin/settings", icon: Settings },
];

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
        }
        if (status === "authenticated" && (session?.user as any)?.role !== "super_admin") {
            router.replace("/dashboard");
        }
    }, [status, session, router]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-medium tracking-wide">Loading platform...</p>
                </div>
            </div>
        );
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "super_admin") {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-screen bg-[#0d0d14] border-r border-white/[0.06] z-50 flex flex-col transition-all duration-300",
                    collapsed ? "w-[72px]" : "w-[260px]"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-white/[0.06] shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold tracking-wide text-white truncate">GymFlow</p>
                            <p className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">Platform Admin</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/super-admin" && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                                )}
                            >
                                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-indigo-400")} />
                                {!collapsed && <span className="truncate">{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="border-t border-white/[0.06] p-3 space-y-1 shrink-0">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-white hover:bg-white/[0.04] w-full transition-colors"
                    >
                        {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
                        {!collapsed && <span>Collapse</span>}
                    </button>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 w-full transition-colors"
                    >
                        <LogOut className="w-[18px] h-[18px]" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={cn("flex-1 transition-all duration-300", collapsed ? "ml-[72px]" : "ml-[260px]")}>
                {/* Top Bar */}
                <header className="h-16 border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between px-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setCollapsed(!collapsed)} className="lg:hidden text-slate-400 hover:text-white">
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-sm font-semibold text-white tracking-wide">
                            {NAV_ITEMS.find(i => pathname === i.href || (i.href !== "/super-admin" && pathname?.startsWith(i.href)))?.label || "Platform Admin"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-xs font-medium text-white">{session?.user?.name}</p>
                            <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Super Admin</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            SA
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
