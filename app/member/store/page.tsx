"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingBag, ChevronLeft, Loader2, Package, Plus, Minus,
    Trash2, X, ShoppingCart, ArrowRight, Upload, CheckCircle,
    Banknote, Smartphone, Clock, Star, Zap, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
    productId: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    quantity: number;
}

type CheckoutStep = "cart" | "payment" | "success";

// ─── Floating Cart Widget ─────────────────────────────────────────────────────
function FloatingCartWidget({ cart, onOpen }: { cart: CartItem[]; onOpen: () => void }) {
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const lastItem = cart[cart.length - 1];

    if (totalItems === 0) return null;

    return (
        <button
            onClick={onOpen}
            id="floating-cart-btn"
            className="fixed bottom-6 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] rounded-2xl px-4 py-3 shadow-2xl shadow-orange-900/50 border border-orange-400/30 active:scale-95 transition-all duration-200"
            style={{ backdropFilter: "blur(20px)" }}
        >
            {lastItem?.image && (
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20 flex-shrink-0">
                    <img src={lastItem.image} alt={lastItem.name} className="w-full h-full object-cover" />
                </div>
            )}
            {!lastItem?.image && (
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-5 h-5 text-white" />
                </div>
            )}
            <div className="text-left">
                <p className="text-[9px] font-black text-orange-100 uppercase tracking-widest leading-none mb-0.5">
                    View Cart
                </p>
                <p className="text-sm font-black text-white leading-none">
                    {totalItems} Item{totalItems !== 1 ? "s" : ""}
                </p>
            </div>
            <div className="w-7 h-7 rounded-xl bg-black/30 flex items-center justify-center ml-1">
                <ArrowRight className="w-4 h-4 text-white" />
            </div>
        </button>
    );
}

// ─── Cart & Checkout Sheet ────────────────────────────────────────────────────
function CartSheet({
    open,
    onClose,
    cart,
    onUpdateQty,
    onRemove,
    onCheckoutComplete,
    token,
}: {
    open: boolean;
    onClose: () => void;
    cart: CartItem[];
    onUpdateQty: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    onCheckoutComplete: () => void;
    token: string;
}) {
    const [step, setStep] = useState<CheckoutStep>("cart");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [placing, setPlacing] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

    // Reset when opening
    useEffect(() => {
        if (open) {
            setStep("cart");
            setPaymentMethod("cash");
            setReceiptFile(null);
            setReceiptPreview(null);
        }
    }, [open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setReceiptFile(file);
        setReceiptPreview(URL.createObjectURL(file));
    };

    const handlePlaceOrder = async () => {
        if (paymentMethod === "online" && !receiptFile) {
            toast.error("Please upload your payment receipt first.");
            return;
        }

        setPlacing(true);
        let receiptUrl: string | null = null;

        try {
            // Upload receipt to Cloudinary if online
            if (paymentMethod === "online" && receiptFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append("file", receiptFile);
                formData.append("folder", "payment-receipts");
                const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok || !uploadData.url) throw new Error("Receipt upload failed");
                receiptUrl = uploadData.url;
                setUploading(false);
            }

            // Place the order
            const res = await fetch("/api/member-portal/store/purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
                    paymentMethod,
                    paymentReceiptUrl: receiptUrl,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to place order");

            setStep("success");
            setTimeout(() => {
                onCheckoutComplete();
                onClose();
            }, 2500);
        } catch (err: any) {
            toast.error(err.message || "Something went wrong");
        } finally {
            setPlacing(false);
            setUploading(false);
        }
    };

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Slide-up Sheet */}
            <div
                className="fixed bottom-0 left-0 right-0 z-50 max-h-[92vh] flex flex-col rounded-t-3xl border border-white/10 overflow-hidden"
                style={{
                    background: "linear-gradient(180deg, #0f1117 0%, #0a0b10 100%)",
                }}
            >
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-12 h-1.5 rounded-full bg-white/20" />
                </div>

                {/* ── SUCCESS ─────────────────────────────────────── */}
                {step === "success" && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 gap-6 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-orange-900/50">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Order Placed!</h3>
                            <p className="text-sm text-slate-400 font-medium max-w-xs">
                                {paymentMethod === "cash"
                                    ? "Visit reception to collect your items and complete payment."
                                    : "Your receipt has been sent for verification. We'll process your order shortly."}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-orange-500 text-xs font-black uppercase tracking-widest">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Closing...
                        </div>
                    </div>
                )}

                {/* ── CART ────────────────────────────────────────── */}
                {step === "cart" && (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Your Cart</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                                    {totalItems} item{totalItems !== 1 ? "s" : ""} selected
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <ShoppingCart className="w-16 h-16 text-slate-800 mb-4" />
                                    <p className="text-slate-600 font-black text-sm uppercase tracking-widest">Cart is empty</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div
                                        key={item.productId}
                                        className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]"
                                    >
                                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-black/40 border border-white/10">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-7 h-7 text-slate-700" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-sm text-white uppercase tracking-wider truncate">
                                                {item.name}
                                            </h4>
                                            <p className="text-orange-500 font-black text-base mt-0.5">
                                                PKR {(item.price * item.quantity).toLocaleString()}
                                            </p>
                                            {item.originalPrice && (
                                                <p className="text-slate-600 text-xs line-through">
                                                    PKR {item.originalPrice}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <button
                                                onClick={() => onRemove(item.productId)}
                                                className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center active:scale-95 transition-transform"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                            <div className="flex items-center gap-2 bg-white/5 rounded-xl border border-white/10 p-1">
                                                <button
                                                    onClick={() => onUpdateQty(item.productId, -1)}
                                                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center active:scale-95 transition-transform"
                                                >
                                                    <Minus className="w-3 h-3 text-white" />
                                                </button>
                                                <span className="font-black text-sm text-white w-5 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQty(item.productId, 1)}
                                                    className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center active:scale-95 transition-transform"
                                                >
                                                    <Plus className="w-3 h-3 text-orange-400" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="px-5 py-5 border-t border-white/5 flex-shrink-0 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold text-sm">Total Amount</span>
                                    <span className="text-2xl font-black text-white tracking-tighter">
                                        PKR {totalAmount.toLocaleString()}
                                    </span>
                                </div>
                                <button
                                    id="proceed-to-payment-btn"
                                    onClick={() => setStep("payment")}
                                    className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest text-black active:scale-95 transition-all shadow-[0_8px_30px_-6px_rgba(255,107,53,0.6)]"
                                    style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" }}
                                >
                                    Proceed to Checkout
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ── PAYMENT ─────────────────────────────────────── */}
                {step === "payment" && (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-4 px-5 py-4 border-b border-white/5 flex-shrink-0">
                            <button
                                onClick={() => setStep("cart")}
                                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-400" />
                            </button>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-tight">Payment</h2>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">Choose method</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                            {/* Order Summary */}
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Order Summary</p>
                                {cart.map((item) => (
                                    <div key={item.productId} className="flex justify-between text-sm">
                                        <span className="text-slate-300 font-semibold">
                                            {item.name} <span className="text-slate-500">×{item.quantity}</span>
                                        </span>
                                        <span className="text-white font-black">PKR {(item.price * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="border-t border-white/10 pt-3 mt-3 flex justify-between">
                                    <span className="font-black text-white text-sm uppercase tracking-wider">Total</span>
                                    <span className="font-black text-orange-500 text-lg">PKR {totalAmount.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Payment Method</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Cash */}
                                    <button
                                        id="payment-cash-btn"
                                        onClick={() => setPaymentMethod("cash")}
                                        className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all active:scale-95 ${
                                            paymentMethod === "cash"
                                                ? "border-orange-500/50 bg-orange-500/10"
                                                : "border-white/10 bg-white/[0.02]"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "cash" ? "bg-orange-500" : "bg-white/10"}`}>
                                            <Banknote className={`w-5 h-5 ${paymentMethod === "cash" ? "text-black" : "text-slate-400"}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black text-sm ${paymentMethod === "cash" ? "text-orange-400" : "text-white"}`}>Cash</p>
                                            <p className="text-[10px] text-slate-500 font-medium leading-tight">Pay at reception</p>
                                        </div>
                                        {paymentMethod === "cash" && (
                                            <div className="ml-auto self-start">
                                                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                                    <CheckCircle className="w-3.5 h-3.5 text-black" />
                                                </div>
                                            </div>
                                        )}
                                    </button>

                                    {/* Online */}
                                    <button
                                        id="payment-online-btn"
                                        onClick={() => setPaymentMethod("online")}
                                        className={`p-4 rounded-2xl border flex flex-col items-start gap-2 transition-all active:scale-95 ${
                                            paymentMethod === "online"
                                                ? "border-orange-500/50 bg-orange-500/10"
                                                : "border-white/10 bg-white/[0.02]"
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === "online" ? "bg-orange-500" : "bg-white/10"}`}>
                                            <Smartphone className={`w-5 h-5 ${paymentMethod === "online" ? "text-black" : "text-slate-400"}`} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-black text-sm ${paymentMethod === "online" ? "text-orange-400" : "text-white"}`}>Online</p>
                                            <p className="text-[10px] text-slate-500 font-medium leading-tight">Easypaisa / Bank</p>
                                        </div>
                                        {paymentMethod === "online" && (
                                            <div className="ml-auto self-start">
                                                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                                    <CheckCircle className="w-3.5 h-3.5 text-black" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Cash instructions */}
                            {paymentMethod === "cash" && (
                                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-black text-amber-400 text-sm mb-1">Visit Reception</p>
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed">
                                                Your order will be marked <strong>Pending</strong>. Come to the reception counter, complete payment in cash, and collect your items. Our staff will mark it as completed.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Online payment details */}
                            {paymentMethod === "online" && (
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                                        <p className="font-black text-xs text-slate-500 uppercase tracking-widest">Send Payment To</p>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Easypaisa</p>
                                                    <p className="font-black text-white text-base tracking-widest">0300-1234567</p>
                                                </div>
                                                <Smartphone className="w-6 h-6 text-green-400" />
                                            </div>
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bank Transfer</p>
                                                    <p className="font-black text-white text-sm tracking-widest">HBL - 0123-456789</p>
                                                </div>
                                                <Banknote className="w-6 h-6 text-blue-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Receipt Upload */}
                                    <div>
                                        <p className="font-black text-xs text-slate-500 uppercase tracking-widest mb-3">Upload Payment Receipt</p>
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="receipt-file-input"
                                        />
                                        {receiptPreview ? (
                                            <div className="relative rounded-2xl overflow-hidden border border-orange-500/30">
                                                <img src={receiptPreview} alt="Receipt" className="w-full max-h-48 object-cover" />
                                                <button
                                                    onClick={() => { setReceiptFile(null); setReceiptPreview(null); }}
                                                    className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/70 backdrop-blur-sm flex items-center justify-center border border-white/20"
                                                >
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                                <div className="absolute bottom-2 left-2 bg-green-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                                                    ✓ Receipt Ready
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                id="upload-receipt-btn"
                                                onClick={() => fileRef.current?.click()}
                                                className="w-full h-32 rounded-2xl border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all hover:border-orange-500/40 hover:bg-orange-500/5"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                                                    <Upload className="w-6 h-6 text-slate-400" />
                                                </div>
                                                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Tap to Upload Screenshot</p>
                                                <p className="text-slate-600 text-[10px] font-medium">JPG, PNG, WEBP</p>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-5 border-t border-white/5 flex-shrink-0">
                            <button
                                id="place-order-btn"
                                onClick={handlePlaceOrder}
                                disabled={placing || uploading || (paymentMethod === "online" && !receiptFile)}
                                className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest text-black active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_8px_30px_-6px_rgba(255,107,53,0.6)]"
                                style={{ background: "linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)" }}
                            >
                                {uploading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Uploading Receipt...</>
                                ) : placing ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Placing Order...</>
                                ) : (
                                    <><ShoppingBag className="w-5 h-5" /> Place Order — PKR {totalAmount.toLocaleString()}</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onAddToCart }: { product: any; onAddToCart: (p: any) => void }) {
    const [pressed, setPressed] = useState(false);
    const outOfStock = product.stockQuantity <= 0;

    const handleAdd = () => {
        if (outOfStock) return;
        setPressed(true);
        setTimeout(() => setPressed(false), 300);
        onAddToCart(product);
    };

    return (
        <div
            className={`relative flex flex-col rounded-3xl overflow-hidden border transition-all duration-300 ${
                outOfStock ? "opacity-60 border-white/5" : "border-white/8 hover:border-orange-500/30"
            }`}
            style={{ background: "linear-gradient(145deg, #12141a 0%, #0e1015 100%)" }}
        >
            {/* Image */}
            <div className="relative aspect-square bg-black/40 overflow-hidden">
                {product.thumbnail?.url ? (
                    <img
                        src={product.thumbnail.url}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${!outOfStock ? "group-hover:scale-110" : ""}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-800" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.discountPrice && (
                        <div className="bg-orange-500 text-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" /> SALE
                        </div>
                    )}
                    {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                        <div className="bg-amber-500/90 text-black px-2 py-0.5 rounded-lg text-[10px] font-black">
                            Only {product.stockQuantity} left
                        </div>
                    )}
                </div>

                {outOfStock && (
                    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center">
                        <p className="text-white font-black text-xs uppercase tracking-[0.25em] border border-white/20 px-4 py-2 rounded-xl -rotate-12">
                            Out of Stock
                        </p>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1">
                {product.categoryId && (
                    <p className="text-[9px] font-black text-orange-500/70 uppercase tracking-widest mb-1">
                        {product.categoryId.name}
                    </p>
                )}
                <h3 className="font-black text-sm text-white uppercase tracking-wide leading-tight mb-2 line-clamp-2 flex-1">
                    {product.name}
                </h3>

                {product.shortDescription && (
                    <p className="text-[10px] text-slate-600 font-medium mb-3 line-clamp-2">
                        {product.shortDescription}
                    </p>
                )}

                {/* Price & CTA */}
                <div className="flex items-center justify-between mt-auto gap-2">
                    <div className="flex flex-col">
                        {product.discountPrice ? (
                            <>
                                <span className="text-[10px] text-slate-600 line-through font-bold">PKR {product.price}</span>
                                <span className="text-lg font-black text-orange-400 leading-none tracking-tight">
                                    PKR {product.discountPrice}
                                </span>
                            </>
                        ) : (
                            <span className="text-lg font-black text-white leading-none tracking-tight">
                                PKR {product.price}
                            </span>
                        )}
                    </div>

                    <button
                        id={`add-to-cart-${product._id}`}
                        onClick={handleAdd}
                        disabled={outOfStock}
                        className={`h-10 px-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-1.5 active:scale-90 transition-all duration-150 ${
                            pressed ? "scale-90" : ""
                        } ${
                            outOfStock
                                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                                : "bg-orange-500 text-black shadow-[0_4px_15px_-4px_rgba(255,107,53,0.6)] hover:bg-orange-400"
                        }`}
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MemberStorePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [token, setToken] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const fetchStore = useCallback(async () => {
        const tok = localStorage.getItem("memberToken");
        if (!tok) { router.push("/login"); return; }
        setToken(tok);
        setLoading(true);

        try {
            const res = await fetch("/api/member-portal/store", {
                headers: { Authorization: `Bearer ${tok}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products || []);
            } else {
                toast.error("Failed to load store catalog");
            }
        } catch {
            toast.error("An error occurred loading the store");
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => { fetchStore(); }, [fetchStore]);

    // Derived categories
    const categories = ["all", ...Array.from(new Set(
        products.map(p => p.categoryId?.name).filter(Boolean)
    ))];

    const filteredProducts = activeCategory === "all"
        ? products
        : products.filter(p => p.categoryId?.name === activeCategory);

    const addToCart = (product: any) => {
        const price = product.discountPrice || product.price;
        setCart(prev => {
            const existing = prev.find(i => i.productId === product._id);
            if (existing) {
                toast.success(`${product.name} quantity updated`, { duration: 1200 });
                return prev.map(i => i.productId === product._id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                );
            }
            toast.success(`${product.name} added to cart`, { duration: 1200 });
            return [...prev, {
                productId: product._id,
                name: product.name,
                price,
                originalPrice: product.discountPrice ? product.price : undefined,
                image: product.thumbnail?.url,
                quantity: 1
            }];
        });
    };

    const updateQty = (productId: string, delta: number) => {
        setCart(prev => prev
            .map(i => i.productId === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
            .filter(i => i.quantity > 0)
        );
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.productId !== productId));
    };

    const onCheckoutComplete = () => {
        setCart([]);
        fetchStore();
    };

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

    return (
        <div className="min-h-screen text-foreground" style={{ background: "#080a0f" }}>
            {/* ── Header ───────────────────────────────────────── */}
            <header className="sticky top-0 z-40 border-b border-white/5" style={{ background: "rgba(8,10,15,0.95)", backdropFilter: "blur(20px)" }}>
                <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push("/member/dashboard")}
                            className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 active:scale-90 transition-transform"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-300" />
                        </button>
                        <div>
                            <h1 className="font-black text-lg text-white uppercase tracking-tight leading-none">
                                Gym <span style={{ color: "#FF6B35" }}>Store</span>
                            </h1>
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                                Shop & Order
                            </p>
                        </div>
                    </div>

                    {totalItems > 0 && (
                        <button
                            onClick={() => setCartOpen(true)}
                            className="relative w-11 h-11 rounded-xl flex items-center justify-center border border-orange-500/30 active:scale-90 transition-transform"
                            style={{ background: "rgba(255,107,53,0.1)" }}
                        >
                            <ShoppingCart className="w-5 h-5 text-orange-400" />
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                                <span className="text-[10px] font-black text-black">{totalItems}</span>
                            </div>
                        </button>
                    )}
                </div>

                {/* Category tabs */}
                {categories.length > 1 && (
                    <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide max-w-2xl mx-auto">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                    activeCategory === cat
                                        ? "text-black"
                                        : "text-slate-500 bg-white/5 border border-white/8"
                                }`}
                                style={activeCategory === cat ? { background: "#FF6B35" } : {}}
                            >
                                {cat === "all" ? "All Items" : cat}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            {/* ── Hero Banner ──────────────────────────────────── */}
            <div className="px-4 pt-5 pb-2 max-w-2xl mx-auto">
                <div
                    className="rounded-3xl p-6 flex items-center justify-between overflow-hidden relative"
                    style={{ background: "linear-gradient(135deg, #1a0e06 0%, #2a1200 100%)", border: "1px solid rgba(255,107,53,0.2)" }}
                >
                    <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 80% 50%, #FF6B35 0%, transparent 60%)" }} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-orange-400" />
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Member Exclusive</span>
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight leading-tight">
                            Premium<br />Supplements
                        </h2>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            Order online. Collect at gym.
                        </p>
                    </div>
                    <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)" }}>
                        <ShoppingBag className="w-8 h-8 text-orange-400" />
                    </div>
                </div>
            </div>

            {/* ── Products Grid ─────────────────────────────────── */}
            <main className="px-4 py-4 max-w-2xl mx-auto pb-32">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)" }}>
                            <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
                        </div>
                        <p className="text-slate-600 font-black text-xs uppercase tracking-widest">Loading Store...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-white/5">
                            <Package className="w-10 h-10 text-slate-700" />
                        </div>
                        <p className="text-slate-600 font-black text-sm uppercase tracking-widest">No Products Here</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.map(product => (
                            <ProductCard key={product._id} product={product} onAddToCart={addToCart} />
                        ))}
                    </div>
                )}
            </main>

            {/* ── Floating Cart Widget ──────────────────────────── */}
            <FloatingCartWidget cart={cart} onOpen={() => setCartOpen(true)} />

            {/* ── Cart / Checkout Sheet ─────────────────────────── */}
            <CartSheet
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                cart={cart}
                onUpdateQty={updateQty}
                onRemove={removeFromCart}
                onCheckoutComplete={onCheckoutComplete}
                token={token}
            />
        </div>
    );
}
