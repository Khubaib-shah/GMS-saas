"use client";

import { useEffect, useState } from "react";
import { 
    CreditCard, 
    Calendar, 
    DollarSign, 
    AlertTriangle, 
    Receipt, 
    Clock, 
    CheckCircle2, 
    ArrowRight,
    RefreshCw,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils/file-utils";

export default function PlatformBillingPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchBilling = async () => {
        try {
            const res = await fetch("/api/billing/platform");
            const d = await res.json();
            if (res.ok) {
                setData(d);
            } else {
                toast.error(d.message || "Failed to load billing info");
            }
        } catch (e) {
            console.error(e);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBilling();
    }, []);

    const handlePurchase = async (planSlug: string) => {
        setIsProcessing(true);
        try {
            const res = await fetch("/api/billing/stripe/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    planSlug,
                    successUrl: window.location.origin + "/admin/billing?success=true",
                    cancelUrl: window.location.origin + "/admin/billing",
                }),
            });
            const d = await res.json();
            if (res.ok && d.url) {
                window.location.href = d.url;
            } else {
                toast.error(d.message || "Could not initiate payment");
            }
        } catch (e) {
            toast.error("Payment failed to initialize");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-muted-foreground animate-pulse">Synchronizing platform data...</p>
                </div>
            </div>
        );
    }

    if (!data?.gym) return null;

    const { gym, payments } = data;
    const isExpired = new Date(gym.expiryDate) < new Date();
    const isTrial = gym.subscriptionStatus === "trial";

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header HUD */}
            <div className="relative">
                <div className="flex items-center gap-4 mb-2">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Platform Operations</span>
                    <div className="h-px w-24 bg-primary/20"></div>
                </div>
                <h1 className="text-5xl font-black text-foreground italic tracking-tighter uppercase leading-none">
                    BILLING & <span className="text-primary">SUBSCRIPTION</span>
                </h1>
                <p className="text-muted-foreground text-sm mt-4 font-medium">Manage your GMS SaaS subscription and view platform transaction records.</p>
                
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: Current Subscription Details */}
                <div className="lg:col-span-12 xl:col-span-4 space-y-8">
                    <Card className="p-8 glass-premium border-primary/20 space-y-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <ShieldCheck className="w-12 h-12 text-primary/10" />
                        </div>
                        
                        <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2 block">Current Status</span>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-3 h-3 rounded-full animate-pulse shadow-[0_0_8px]",
                                    gym.subscriptionStatus === "active" ? "bg-emerald-500 shadow-emerald-500/50" : 
                                    isTrial ? "bg-blue-500 shadow-blue-500/50" : "bg-destructive shadow-destructive/50"
                                )}></div>
                                <h3 className="text-2xl font-black italic tracking-tight uppercase">
                                    {gym.subscriptionStatus === "active" ? "Subscribed" : isTrial ? "Free Trial" : "Expired"}
                                </h3>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Plan Tier</span>
                                </div>
                                <span className="text-sm font-black text-primary uppercase italic">{gym.plan?.name || "Free Tier"}</span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Expiry Date</span>
                                </div>
                                <span className="text-sm font-black uppercase italic">{formatDate(gym.expiryDate || gym.trialEndsAt)}</span>
                            </div>

                            {gym.outstandingAmount > 0 && (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-destructive/10 border border-destructive/20 mt-4 animate-pulse">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-5 h-5 text-destructive" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-destructive">Outstanding</span>
                                    </div>
                                    <span className="text-sm font-black text-destructive italic">{formatCurrency(gym.outstandingAmount)}</span>
                                </div>
                            )}
                        </div>

                        <Button 
                            className="w-full h-14 bg-primary text-black hover:bg-white font-black italic tracking-tighter text-lg rounded-xl transition-all uppercase shadow-lg shadow-primary/20"
                            onClick={() => handlePurchase(gym.plan?.slug || "standard")}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Redirecting..." : "Renew or Upgrade Now"}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Card>

                    {/* Quick Stats Panel */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 glass-premium border-white/5 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                <Receipt className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="text-2xl font-black italic">{payments.length}</h4>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total Invoices</p>
                        </div>
                        <div className="p-6 glass-premium border-white/5 rounded-2xl">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                <Clock className="w-5 h-5 text-primary" />
                            </div>
                            <h4 className="text-2xl font-black italic">{isExpired ? "0" : "Active"}</h4>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Days Remaining</p>
                        </div>
                    </div>
                </div>

                {/* Right: Payment Logs */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black italic tracking-tight uppercase">Invoicing <span className="text-primary">History</span></h3>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>

                    <Card className="glass-premium border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Plan</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center">
                                                <p className="text-sm text-slate-500 italic">No platform payments found.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((p: any) => (
                                            <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-6">
                                                    <p className="text-xs font-black uppercase italic tracking-tight">{formatDate(p.paymentDate)}</p>
                                                    <p className="text-[9px] text-slate-500 uppercase font-bold mt-1 tracking-widest">{p.paymentMethod}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                                        <span className="text-xs font-black uppercase text-foreground italic">{p.planName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-1.5 text-emerald-400">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Settled</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-right">
                                                    <span className="text-sm font-black text-primary italic font-mono">{formatCurrency(p.amountPKR)}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Tactile Sidebar Info */}
                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-1">Platform Security Protocol</h5>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                                All platform payments are processed via an encrypted gateway. While we are in a testing phase using a dummy Stripe implementation, your data remains secured under GMS SaaS governance pillars.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
