"use client";

import { useState, useEffect } from "react";
import {
    ChevronLeft,
    Save,
    Image as ImageIcon,
    Plus,
    X,
    Info,
    Zap,
    Package,
    BarChart3,
    FileText,
    Dumbbell
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { InputField } from "@/components/ui/input-field";
import { Field, FieldLabel } from "@/components/ui/field";
import { AssetPicker } from "@/components/gallery/asset-picker";

export default function NewProduct() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        shortDescription: "",
        description: "",
        price: "",
        discountPrice: "",
        costPrice: "",
        sku: "",
        barcode: "",
        stockQuantity: "0",
        lowStockThreshold: "5",
        categoryId: "",
        brandId: "",
        status: "active",
        trackInventory: true,
        nutritionalInfo: {
            servingSize: "",
            calories: "",
            protein: "",
            carbs: "",
            fat: ""
        }
    });

    const [thumbnailAsset, setThumbnailAsset] = useState<any>(null);
    const [galleryAssets, setGalleryAssets] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/products/categories").then(res => res.json()).then(setCategories);
    }, []);

    useEffect(() => {
        if (formData.name) {
            const slug = formData.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
            setFormData(prev => ({ ...prev, slug }));
        }
    }, [formData.name]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Thumbnail
            let uploadedThumbnail = thumbnailAsset ? {
                url: thumbnailAsset.url,
                publicId: thumbnailAsset.publicId
            } : null;

            // 2. Gallery Images
            const uploadedImages = galleryAssets.map(asset => ({
                url: asset.url,
                publicId: asset.publicId
            }));

            const payload = {
                ...formData,
                categoryId: formData.categoryId || undefined,
                brandId: formData.brandId || undefined,
                price: parseFloat(formData.price),
                discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
                costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
                stockQuantity: parseInt(formData.stockQuantity),
                lowStockThreshold: parseInt(formData.lowStockThreshold),
                thumbnail: uploadedThumbnail,
                images: uploadedImages,
                nutritionalInfo: {
                    ...formData.nutritionalInfo,
                    calories: formData.nutritionalInfo.calories ? parseFloat(formData.nutritionalInfo.calories) : undefined,
                    protein: formData.nutritionalInfo.protein ? parseFloat(formData.nutritionalInfo.protein) : undefined,
                    carbs: formData.nutritionalInfo.carbs ? parseFloat(formData.nutritionalInfo.carbs) : undefined,
                    fat: formData.nutritionalInfo.fat ? parseFloat(formData.nutritionalInfo.fat) : undefined,
                }
            };

            toast.loading("Saving product details...", { id: "product-upload" });
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success("Product created successfully!", { id: "product-upload" });
                router.push("/selling/products");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create product", { id: "product-upload" });
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred", { id: "product-upload" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto md:p-8 space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Header */}
            <DashboardHeader
                title="New"
                highlight="Product"
                subtitle="Catalog Engineering"
                description="Fill in the details to add a new item to your catalog"
            >
                <div className="relative z-10 flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                    <Link href="/selling/products" className="flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-primary hover:text-black transition-all">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </Button>
                    </Link>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 md:flex-none h-10 md:h-12 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all px-4 md:px-10 shadow-2xl active:scale-95 text-[10px] md:text-sm"
                    >
                        {loading ? "SAVING..." : "SAVE PRODUCT"}
                        <Save className="w-4 h-4 md:w-5 md:h-5 ml-2 stroke-[3px]" />
                    </Button>
                </div>
            </DashboardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                {/* Left Column: Main Form */}
                <div className="lg:col-span-2 space-y-4 md:space-y-8">
                    <Card className="glass-premium bg-slate-950/20 border-white/5 p-6 md:p-10 space-y-4 md:space-y-8 rounded-[24px] md:rounded-[32px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 translate-x-10 pointer-events-none" />
                        <div className="flex items-center gap-3 mb-2 relative">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tighter text-white">Basic Information</h3>
                        </div>
                        <div className="space-y-4 md:space-y-6 relative">
                            <InputField
                                label="Product Name"
                                value={formData.name}
                                onChange={val => setFormData({ ...formData, name: val })}
                                placeholder="E.G. WHEY PROTEIN ISOLATE"
                                required
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <InputField
                                    label="Slug (URL Path)"
                                    value={formData.slug}
                                    onChange={val => setFormData({ ...formData, slug: val })}
                                    placeholder="whey-protein-isolate"
                                />
                                <Field>
                                    <FieldLabel className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1">Category</FieldLabel>
                                    <Select
                                        value={formData.categoryId}
                                        onValueChange={val => setFormData({ ...formData, categoryId: val === "__none__" ? "" : val })}
                                    >
                                        <SelectTrigger className="w-full h-12 md:h-14 !rounded-sm md:rounded-2xl bg-black/40 border border-white/10 focus:border-primary/50 transition-all font-black text-[9px] md:text-[10px] tracking-widest px-4 md:px-6 outline-none text-white cursor-pointer">
                                            <SelectValue placeholder="SELECT CATEGORY" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-white/10">
                                            <SelectItem value="__none__" className="text-[10px] font-bold uppercase tracking-widest">NONE</SelectItem>
                                            {categories.map(c => (
                                                <SelectItem key={c._id} value={c._id} className="text-[10px] font-bold uppercase tracking-widest">
                                                    {c.name.toUpperCase()}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>
                            </div>
                            <InputField
                                label="Short Description"
                                value={formData.shortDescription}
                                onChange={val => setFormData({ ...formData, shortDescription: val })}
                                placeholder="BRIEF ONE-LINE SUMMARY FOR CATALOG BROWSING"
                                className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-primary/50 transition-all font-black uppercase tracking-widest px-6 text-xs"
                            />
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="DETAILED PRODUCT SPECIFICATIONS AND BENEFITS..."
                                    className="min-h-[150px] rounded-2xl bg-black/40 border-white/10 focus:border-primary/50 transition-all p-6 text-xs font-black uppercase tracking-widest leading-relaxed"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Pricing & Inventory */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <Card className="glass-premium bg-slate-950/20 border-white/5 p-6 md:p-10 space-y-6 md:space-y-8 rounded-[24px] md:rounded-[32px]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-white">Pricing</h3>
                            </div>
                            <div className="space-y-6">
                                <InputField
                                    label="Sale Price (PKR)"
                                    type="number"
                                    validateType="number"
                                    value={formData.price}
                                    onChange={val => setFormData({ ...formData, price: val })}
                                    placeholder="0.00"
                                    className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-primary/50 transition-all font-black text-xl px-6"
                                />
                                <InputField
                                    label="Discount Price (Optional)"
                                    type="number"
                                    validateType="number"
                                    value={formData.discountPrice}
                                    onChange={val => setFormData({ ...formData, discountPrice: val })}
                                    placeholder="0.00"
                                    className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-emerald-500/50 transition-all font-black text-xl px-6 text-emerald-500"
                                />
                            </div>
                        </Card>

                        <Card className="glass-premium bg-slate-950/20 border-white/5 p-6 md:p-10 space-y-6 md:space-y-8 rounded-[24px] md:rounded-[32px]">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Package className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black uppercase tracking-tighter text-white">Inventory</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <InputField
                                        label="SKU"
                                        value={formData.sku}
                                        onChange={val => setFormData({ ...formData, sku: val })}
                                        placeholder="SKU-123"
                                        className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-primary/50 transition-all font-mono text-xs px-6"
                                    />
                                    <InputField
                                        label="Initial Stock"
                                        type="number"
                                        validateType="number"
                                        value={formData.stockQuantity}
                                        onChange={val => setFormData({ ...formData, stockQuantity: val })}
                                        className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-primary/50 transition-all font-black text-lg px-6"
                                    />
                                </div>
                                <InputField
                                    label="Low Stock Threshold"
                                    type="number"
                                    validateType="number"
                                    value={formData.lowStockThreshold}
                                    onChange={val => setFormData({ ...formData, lowStockThreshold: val })}
                                    className="h-14 rounded-2xl bg-black/40 border-white/10 focus:border-rose-500/50 transition-all font-black text-rose-500 px-6 text-lg"
                                />
                            </div>
                        </Card>
                    </div>

                    {/* Nutritional Info (Supplement Specific) */}
                    <Card className="glass-premium bg-slate-950/20 border-white/5 p-6 md:p-10 space-y-6 md:space-y-8 rounded-[24px] md:rounded-[32px]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Dumbbell className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tighter text-white">Nutritional Profile</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                            {[
                                { label: "Serving Size", key: "servingSize", placeholder: "30G", type: "text" },
                                { label: "Calories", key: "calories", placeholder: "0", type: "number" },
                                { label: "Protein (G)", key: "protein", placeholder: "0", type: "number", accent: true },
                                { label: "Carbs (G)", key: "carbs", placeholder: "0", type: "number" },
                                { label: "Fat (G)", key: "fat", placeholder: "0", type: "number" },
                            ].map((field) => (
                                <InputField
                                    key={field.key}
                                    label={field.label}
                                    type={field.type as any}
                                    validateType={field.type === "number" ? "number" : "text"}
                                    value={(formData.nutritionalInfo as any)[field.key]}
                                    onChange={val => setFormData({ ...formData, nutritionalInfo: { ...formData.nutritionalInfo, [field.key]: val } })}
                                    placeholder={field.placeholder}
                                    className={cn(
                                        "h-12 rounded-xl bg-black/40 border-white/10 text-center font-black uppercase text-[10px] tracking-widest px-2 focus:border-primary/50 transition-all",
                                        field.accent && "text-primary border-primary/20"
                                    )}
                                />
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Media */}
                <div className="space-y-6 md:space-y-8">
                    <Card className="glass-premium bg-slate-950/20 border-white/5 p-6 md:p-10 space-y-6 md:space-y-8 rounded-[24px] md:rounded-[32px]">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tighter text-white">Product Media</h3>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Main Thumbnail</label>
                                <AssetPicker
                                    onSelect={(asset) => setThumbnailAsset(asset)}
                                    trigger={
                                        <div className="group cursor-pointer">
                                            {thumbnailAsset ? (
                                                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                                                    <img src={thumbnailAsset.url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <Button variant="ghost" className="text-white text-[10px] font-black uppercase tracking-widest">Change</Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:scale-110 transition-transform">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Thumbnail</p>
                                                </div>
                                            )}
                                        </div>
                                    }
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gallery Showcase</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {galleryAssets.map((asset, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group bg-black/40">
                                            <img src={asset.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setGalleryAssets(prev => prev.filter((_, i) => i !== idx))}
                                                    className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white"
                                                >
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <AssetPicker
                                        multiple={true}
                                        onSelect={(assets: any) => setGalleryAssets(prev => [...prev, ...(Array.isArray(assets) ? assets : [assets])])}
                                        trigger={
                                            <div className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all group cursor-pointer">
                                                <Plus className="w-5 h-5 text-slate-500 group-hover:scale-110 transition-transform" />
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/5 p-6 rounded-2xl">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center leading-relaxed">
                                RECOMMENDED: 1000 X 1000 PX (PNG/JPG)<br />
                                MAX 5 GALLERY IMAGES
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
