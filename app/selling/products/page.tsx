"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    Package,
    MoreHorizontal,
    Image as ImageIcon,
    Loader2,
    ChevronLeft,
    AlertCircle,
    Eye,
    Edit3,
    Trash2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { FeatureGate } from "@/components/ui/feature-gate";

export default function ProductList() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            if (data.products) setProducts(data.products);
        } catch (err) {
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setProductToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!productToDelete) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/products/${productToDelete}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Product deleted successfully");
                setDeleteModalOpen(false);
                fetchProducts();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete product");
            }
        } catch (err) {
            toast.error("An error occurred while deleting");
        } finally {
            setDeleting(false);
            setProductToDelete(null);
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <FeatureGate feature={["selling", "commerce"]}>
            <div className="md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700">
                <DashboardHeader
                    title="Product"
                    highlight="Catalog"
                    subtitle="Inventory Intelligence"
                    description="Manage your full inventory and digital storefront"
                >
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 relative z-10 w-full md:w-auto">
                        <Link href="/selling" className="flex-shrink-0">
                            <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-primary hover:text-black transition-all">
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </Button>
                        </Link>
                        <Link href="/selling/categories" className="flex-1 md:flex-none">
                            <Button variant="outline" className="w-full md:w-auto h-10 md:h-12 rounded-xl md:rounded-2xl border-white/5 bg-white/5 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 md:px-8 hover:bg-white/10 transition-all">
                                Collections
                            </Button>
                        </Link>
                        <Link href="/selling/products/new" className="flex-[2] md:flex-none">
                            <Button className="w-full md:w-auto h-10 md:h-12 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all px-4 md:px-8 shadow-2xl active:scale-95">
                                <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 stroke-[3px]" />
                                Add Product
                            </Button>
                        </Link>
                    </div>
                </DashboardHeader>

                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                            placeholder="SEARCH PRODUCTS OR SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 md:h-12 pl-12 rounded-xl md:rounded-2xl bg-slate-950/20 border-white/5 focus:border-primary/50 transition-all font-black text-[9px] md:text-[10px] tracking-widest"
                        />
                    </div>
                    <Button variant="outline" className="h-10 md:h-12 w-full sm:w-auto rounded-xl md:rounded-2xl border-white/5 bg-slate-950/20 text-[9px] md:text-[10px] font-black uppercase tracking-widest px-6">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-40 space-y-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accessing Catalog Engine...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <Card className="glass-premium bg-slate-950/20 border-white/5 p-40 text-center border-dashed rounded-[40px]">
                        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                            <Package className="w-10 h-10 text-slate-700" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-400">Inventory Empty</h3>
                        <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">Start by adding your first product to the catalog.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {/* Table Header (Desktop) */}
                        <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-4 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5 mb-2">
                            <div className="col-span-5">Product Details</div>
                            <div className="col-span-2">Category</div>
                            <div className="col-span-2">Stock Level</div>
                            <div className="col-span-2">Unit Price</div>
                            <div className="col-span-1 text-right">Actions</div>
                        </div>

                        {filteredProducts.map((product) => (
                            <Card key={product._id} className="glass-premium bg-slate-950/20 border-white/5 group hover:border-primary/20 hover:bg-white/[0.02] transition-all duration-500 rounded-3xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-16 -translate-y-8" />
                                <div className="p-4 md:px-8 md:py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center relative">
                                    {/* Details */}
                                    <div className="md:col-span-5 flex items-center gap-4 md:gap-6">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                            {product.thumbnail?.url ? (
                                                <img src={product.thumbnail.url} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-slate-700 group-hover:text-primary transition-colors" />
                                            )}
                                        </div>
                                        <div className="overflow-hidden space-y-1 md:space-y-1.5 flex-1">
                                            <h4 className="text-lg md:text-2xl font-black uppercase tracking-tighter truncate text-white group-hover:text-primary transition-colors">{product.name}</h4>
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                                <code className="text-[8px] md:text-[10px] font-mono text-slate-500 bg-black/40 px-2 py-0.5 rounded border border-white/5">{product.sku || "NO-SKU"}</code>
                                                {product.status === 'draft' && <Badge className="bg-amber-500/10 text-amber-500 border-none text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 leading-none">DRAFT</Badge>}
                                                {product.isFeatured && <Badge className="bg-primary/10 text-primary border-none text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 leading-none">FEATURED</Badge>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Category (Hidden on mobile or moved) */}
                                    <div className="hidden md:block md:col-span-2">
                                        <Badge className="bg-white/5 border-white/5 text-[9px] font-black tracking-widest uppercase px-3 py-1.5 text-slate-400">
                                            {product.categoryId?.name || "Uncategorized"}
                                        </Badge>
                                    </div>

                                    {/* Stock & Price Row on Mobile */}
                                    <div className="grid grid-cols-2 md:contents gap-4">
                                        {/* Stock */}
                                        <div className="md:col-span-2 flex flex-col">
                                            <span className={cn(
                                                "text-lg md:text-2xl font-black tracking-tighter",
                                                product.stockQuantity <= product.lowStockThreshold ? "text-rose-500" : "text-white"
                                            )}>
                                                {product.stockQuantity}
                                            </span>
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mt-1 flex items-center gap-2">
                                                {product.stockQuantity <= product.lowStockThreshold ? (
                                                    <><AlertCircle className="w-3 h-3 text-rose-500" /> <span className="text-rose-500">LOW</span></>
                                                ) : (
                                                    <>IN STOCK</>
                                                )}
                                            </span>
                                        </div>

                                        {/* Price */}
                                        <div className="md:col-span-2 flex flex-col">
                                            <span className="text-lg md:text-2xl font-black tracking-tighter text-white">PKR {product.price}</span>
                                            {product.discountPrice && (
                                                <span className="text-[8px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none mt-1">
                                                    SAVE PKR {product.price - product.discountPrice}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="md:col-span-1 flex md:justify-end gap-2 md:gap-3 relative z-10 pt-4 md:pt-0 border-t border-white/5 md:border-none">
                                        <Link href={`/selling/products/edit/${product._id}`} className="flex-1 md:flex-none">
                                            <Button variant="ghost" size="icon" className="h-10 w-full md:h-12 md:w-12 rounded-xl bg-white/5 hover:bg-primary hover:text-black transition-all">
                                                <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                                            </Button>
                                        </Link>
                                        <Button
                                            onClick={() => handleDelete(product._id)}
                                            variant="ghost" size="icon" className="flex-1 md:flex-none h-10 w-full md:h-12 md:w-12 rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <ConfirmModal
                    open={deleteModalOpen}
                    onOpenChange={setDeleteModalOpen}
                    title="Delete"
                    highlight="Product"
                    description="Are you sure you want to delete this product? This action cannot be undone and will remove the item from all digital storefronts."
                    onConfirm={confirmDelete}
                    loading={deleting}
                    confirmText="Delete Product"
                    variant="destructive"
                />
            </div>
        </FeatureGate>
    );
}
