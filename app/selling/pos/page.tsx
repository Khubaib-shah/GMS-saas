"use client";

import { useState, useEffect } from "react";
import {
    ShoppingCart,
    Search,
    Plus,
    Minus,
    Trash2,
    ChevronLeft,
    CreditCard,
    User,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { FeatureGate } from "@/components/ui/feature-gate";

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    maxStock: number;
    image?: string;
}

export default function PointOfSale() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (data.products) setProducts(data.products.filter((p: any) => p.status === 'active' && p.stockQuantity > 0));
        } catch (err) {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product._id);
            if (existing) {
                if (existing.quantity >= product.stockQuantity) {
                    toast.error(`Only ${product.stockQuantity} in stock`);
                    return prev;
                }
                return prev.map(item => 
                    item.productId === product._id 
                        ? { ...item, quantity: item.quantity + 1 } 
                        : item
                );
            }
            return [...prev, {
                productId: product._id,
                name: product.name,
                price: product.discountPrice || product.price,
                quantity: 1,
                maxStock: product.stockQuantity,
                image: product.thumbnail?.url
            }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQuantity = item.quantity + delta;
                if (newQuantity <= 0) return item; // Handled by remove
                if (newQuantity > item.maxStock) {
                    toast.error("Maximum stock reached");
                    return item;
                }
                return { ...item, quantity: newQuantity };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);

        try {
            const res = await fetch("/api/selling/pos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cart,
                    paymentMethod,
                    totalAmount: cartTotal
                })
            });

            if (res.ok) {
                toast.success("Sale completed successfully!");
                setCart([]);
                fetchProducts(); // Refresh stock
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to process sale");
            }
        } catch (error) {
            toast.error("An error occurred during checkout");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <FeatureGate feature={["selling", "commerce"]}>
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-20">
                <DashboardHeader
                    title="Point of"
                    highlight="Sale"
                    subtitle="Direct Checkout"
                    description="Process in-gym purchases for members and walk-ins"
                >
                    <div className="flex items-center gap-2 md:gap-3 relative z-10 w-full md:w-auto">
                        <Link href="/selling" className="flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-emerald-500 hover:text-white/80 transition-all">
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                        </Link>
                    </div>
                </DashboardHeader>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                    {/* Left Panel: Products */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <Input
                                placeholder="SEARCH CATALOG..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-12 pl-12 rounded-2xl bg-slate-950/20 border-white/5 focus:border-emerald-500/50 transition-all font-black text-[10px] tracking-widest"
                            />
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-20">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center p-20 opacity-50">
                                <p className="text-[10px] font-black uppercase tracking-widest">No products available</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map(product => (
                                    <div 
                                        key={product._id} 
                                        onClick={() => addToCart(product)}
                                        className="glass-premium bg-slate-950/20 border-white/5 p-4 rounded-2xl cursor-pointer hover:border-emerald-500/30 hover:bg-white/5 transition-all group active:scale-95"
                                    >
                                        <div className="aspect-square rounded-xl bg-black/40 overflow-hidden mb-3 border border-white/5 relative">
                                            {product.thumbnail?.url ? (
                                                <img src={product.thumbnail.url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingCart className="w-6 h-6 text-slate-700" />
                                                </div>
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black text-white tracking-widest border border-white/10">
                                                {product.stockQuantity} LEFT
                                            </div>
                                        </div>
                                        <h4 className="font-black text-[10px] uppercase tracking-wider truncate mb-1 text-white group-hover:text-emerald-500 transition-colors">
                                            {product.name}
                                        </h4>
                                        <p className="font-black text-sm text-slate-300">
                                            PKR {product.discountPrice || product.price}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Cart */}
                    <div className="lg:col-span-4">
                        <Card className="glass-premium bg-slate-950/20 border-white/5 p-6 rounded-3xl sticky top-24 flex flex-col h-[calc(100vh-380px)]">
                            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
                                <h3 className="text-xl font-black uppercase tracking-tighter text-emerald-500">Current Order</h3>
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px]">{cart.length} ITEMS</Badge>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-6 pr-2">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <ShoppingCart className="w-12 h-12 mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Cart is empty</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.productId} className="flex flex-col gap-2 p-3 rounded-2xl bg-black/40 border border-white/5">
                                            <div className="flex justify-between items-start">
                                                <span className="font-black text-[11px] uppercase tracking-wider text-white line-clamp-1 flex-1 pr-2">{item.name}</span>
                                                <span className="font-black text-[11px] text-emerald-500 shrink-0">PKR {item.price * item.quantity}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/10" onClick={() => updateQuantity(item.productId, -1)}>
                                                        <Minus className="w-3 h-3" />
                                                    </Button>
                                                    <span className="font-black text-[10px] w-4 text-center">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white/10" onClick={() => updateQuantity(item.productId, 1)}>
                                                        <Plus className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-rose-500/20 text-rose-500 transition-colors" onClick={() => removeFromCart(item.productId)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="pt-6 border-t border-white/5 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button 
                                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`h-10 text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'cash' ? 'bg-emerald-500 text-black' : 'bg-transparent border-white/10 text-slate-400'}`}
                                        >
                                            Cash
                                        </Button>
                                        <Button 
                                            variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                            onClick={() => setPaymentMethod('card')}
                                            className={`h-10 text-[10px] font-black uppercase tracking-widest ${paymentMethod === 'card' ? 'bg-emerald-500 text-black' : 'bg-transparent border-white/10 text-slate-400'}`}
                                        >
                                            Card/Online
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pb-1">Total Due</span>
                                    <span className="text-3xl font-black tracking-tighter text-white">PKR {cartTotal}</span>
                                </div>

                                <Button 
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0 || processing}
                                    className="w-full h-14 rounded-2xl bg-emerald-500 text-black hover:bg-white font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]"
                                >
                                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 mr-2" />
                                            COMPLETE SALE
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </FeatureGate>
    );
}
