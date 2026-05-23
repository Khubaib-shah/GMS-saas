"use client";

import { useState, useEffect } from "react";
import {
    ShoppingCart,
    Search,
    ChevronLeft,
    CheckCircle2,
    Loader2,
    Eye,
    Clock,
    Package,
    Banknote,
    Smartphone,
    User
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { FeatureGate } from "@/components/ui/feature-gate";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch("/api/selling/orders");
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
        } catch {
            toast.error("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.receiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.memberId?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        o.memberId?.email?.toLowerCase().includes(search.toLowerCase())
    );

    const pendingCount = orders.filter(o => o.status === "pending").length;

    const handleCompleteOrder = async (orderId: string) => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/selling/orders/${orderId}/complete`, {
                method: "POST"
            });
            if (res.ok) {
                toast.success("Order completed! Stock has been deducted.");
                fetchOrders();
                setModalOpen(false);
                setSelectedOrder(null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to complete order.");
            }
        } catch {
            toast.error("Error occurred while completing order.");
        } finally {
            setProcessing(false);
        }
    };

    const openOrder = (order: any) => {
        setSelectedOrder(order);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedOrder(null);
    };

    return (
        <FeatureGate feature={["selling", "commerce"]}>
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">
                <DashboardHeader
                    title="Order"
                    highlight="Management"
                    subtitle="Member Purchases"
                    description="Review pending member orders and verify payments before completing"
                >
                    <div className="flex items-center gap-2 md:gap-3 relative z-10 w-full md:w-auto">
                        <Link href="/selling" className="flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-emerald-500 hover:text-white/80 transition-all">
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                        </Link>
                    </div>
                </DashboardHeader>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="glass-premium bg-slate-950/20 border-white/5 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-white">{orders.length}</p>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Total</p>
                    </div>
                    <div className="glass-premium bg-amber-950/20 border-amber-500/10 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1">Pending</p>
                    </div>
                    <div className="glass-premium bg-emerald-950/20 border-emerald-500/10 p-4 rounded-2xl text-center">
                        <p className="text-2xl font-black text-emerald-400">{orders.filter(o => o.status === "completed").length}</p>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Completed</p>
                    </div>
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                        placeholder="Search receipt or member..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 pl-12 rounded-2xl bg-slate-950/20 border-white/5 focus:border-emerald-500/50 transition-all font-bold text-sm"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center p-20 glass-premium bg-slate-950/20 border-white/5 rounded-3xl">
                        <ShoppingCart className="w-12 h-12 mb-4 mx-auto text-slate-700" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No orders found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredOrders.map(order => (
                            <Card
                                key={order._id}
                                className={`relative overflow-hidden border p-5 rounded-3xl transition-all cursor-pointer hover:border-white/10 ${
                                    order.status === "pending"
                                        ? "bg-amber-950/10 border-amber-500/15"
                                        : "bg-slate-950/20 border-white/5"
                                }`}
                                onClick={() => openOrder(order)}
                            >
                                {/* Status badge */}
                                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1 ${
                                    order.status === "pending"
                                        ? "bg-amber-500 text-black"
                                        : order.status === "completed"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-red-500/20 text-red-400"
                                }`}>
                                    {order.status === "pending" && <Clock className="w-2.5 h-2.5" />}
                                    {order.status === "completed" && <CheckCircle2 className="w-2.5 h-2.5" />}
                                    {order.status}
                                </div>

                                <div className="pt-3 mb-4">
                                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{order.receiptNumber}</p>
                                    <h4 className="font-black text-base uppercase tracking-wide text-white mt-1 truncate">
                                        {order.memberId
                                            ? `${order.memberId.firstName} ${order.memberId.lastName}`
                                            : "Walk-in"}
                                    </h4>
                                    {order.memberId?.email && (
                                        <p className="text-xs text-slate-500 truncate">{order.memberId.email}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5 mb-4">
                                    {order.items.slice(0, 2).map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-slate-400 font-semibold truncate pr-2">
                                                {item.quantity}× {item.name}
                                            </span>
                                            <span className="text-white font-black shrink-0">PKR {item.subtotal.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {order.items.length > 2 && (
                                        <p className="text-[10px] text-slate-600 italic">+{order.items.length - 2} more items</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        {order.paymentMethod === "cash" || order.paymentMethod === "member_credit"
                                            ? <Banknote className="w-3.5 h-3.5 text-slate-500" />
                                            : <Smartphone className="w-3.5 h-3.5 text-slate-500" />}
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            {order.paymentMethod}
                                        </span>
                                    </div>
                                    <span className="font-black text-sm text-white">
                                        PKR {order.finalAmount.toLocaleString()}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Detail Modal (custom, not ConfirmModal since we need rich content) */}
            {modalOpen && selectedOrder && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
                    <div className="fixed inset-x-4 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 rounded-t-3xl md:rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
                        style={{ background: "linear-gradient(180deg, #0f1117 0%, #0a0b10 100%)" }}
                    >
                        {/* Handle (mobile) */}
                        <div className="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
                            <div className="w-12 h-1.5 rounded-full bg-white/20" />
                        </div>

                        {/* Header */}
                        <div className="flex items-start justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
                            <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{selectedOrder.receiptNumber}</p>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mt-0.5">Order Details</h3>
                            </div>
                            <button onClick={closeModal} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mt-1">
                                <ChevronLeft className="w-4 h-4 text-slate-400 rotate-180" />
                            </button>
                        </div>

                        {/* Scrollable body */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                            {/* Member info */}
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="font-black text-sm text-white">
                                        {selectedOrder.memberId
                                            ? `${selectedOrder.memberId.firstName} ${selectedOrder.memberId.lastName}`
                                            : "Walk-in Customer"}
                                    </p>
                                    {selectedOrder.memberId?.email && (
                                        <p className="text-xs text-slate-500">{selectedOrder.memberId.email}</p>
                                    )}
                                </div>
                                <div className={`ml-auto px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest ${
                                    selectedOrder.status === "pending" ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                                }`}>
                                    {selectedOrder.status}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Items Ordered</p>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                                    <Package className="w-3.5 h-3.5 text-slate-500" />
                                                </div>
                                                <span className="text-sm text-white font-semibold">
                                                    {item.name}
                                                    <span className="text-slate-500 ml-1">×{item.quantity}</span>
                                                </span>
                                            </div>
                                            <span className="font-black text-sm text-emerald-400">PKR {item.subtotal.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-3 border-t border-white/10 flex justify-between">
                                    <span className="font-black text-sm text-white uppercase tracking-wider">Total</span>
                                    <span className="font-black text-lg text-white">PKR {selectedOrder.finalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Payment info */}
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment</p>
                                <div className="flex items-center gap-2">
                                    {selectedOrder.paymentMethod === "online"
                                        ? <Smartphone className="w-4 h-4 text-blue-400" />
                                        : <Banknote className="w-4 h-4 text-green-400" />}
                                    <span className="font-black text-sm text-white capitalize">{selectedOrder.paymentMethod}</span>
                                </div>
                                {selectedOrder.notes && (
                                    <p className="text-xs text-slate-500 mt-2 italic">{selectedOrder.notes}</p>
                                )}
                            </div>

                            {/* Receipt image */}
                            {selectedOrder.paymentReceiptUrl && (
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Payment Receipt</p>
                                    <div className="rounded-2xl overflow-hidden border border-white/10">
                                        <img
                                            src={selectedOrder.paymentReceiptUrl}
                                            alt="Payment Receipt"
                                            className="w-full max-h-72 object-contain bg-black/50"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cash reminder */}
                            {selectedOrder.paymentMethod === "cash" && selectedOrder.status === "pending" && (
                                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex gap-2">
                                    <Clock className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-amber-300 font-medium">
                                        Ensure cash payment has been collected at reception before marking as completed.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="px-6 py-5 border-t border-white/5 flex gap-3 flex-shrink-0">
                            <Button
                                variant="ghost"
                                onClick={closeModal}
                                className="flex-1 h-12 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest"
                            >
                                Close
                            </Button>
                            {selectedOrder.status === "pending" && (
                                <Button
                                    id="complete-order-btn"
                                    onClick={() => handleCompleteOrder(selectedOrder._id)}
                                    disabled={processing}
                                    className="flex-1 h-12 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 font-black text-xs uppercase tracking-widest shadow-[0_4px_20px_-4px_rgba(16,185,129,0.5)]"
                                >
                                    {processing
                                        ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Processing...</>
                                        : <><CheckCircle2 className="w-4 h-4 mr-2" />Mark Completed</>
                                    }
                                </Button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </FeatureGate>
    );
}
