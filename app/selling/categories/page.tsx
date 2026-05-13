"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Image as ImageIcon,
    ChevronRight,
    Loader2,
    ChevronLeft,
    Save,
    X
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import { MediaUpload } from "@/components/media-upload";
import { uploadToCloudinary } from "@/lib/upload-utils";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function CategoryManagement() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [categoryFile, setCategoryFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        image: { url: "", publicId: "" }
    });

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Auto-slug
    useEffect(() => {
        if (formData.name && !editingCategory) {
            setFormData(prev => ({
                ...prev,
                slug: formData.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "")
            }));
        }
    }, [formData.name, editingCategory]);

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/products/categories");
            const data = await res.json();
            if (Array.isArray(data)) setCategories(data);
        } catch (err) {
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: any) => {
        setCategoryFile(null);
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || "",
                image: category.image || { url: "", publicId: "" }
            });
        } else {
            setEditingCategory(null);
            setFormData({ name: "", slug: "", description: "", image: { url: "", publicId: "" } });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) return toast.error("Name and slug are required");
        setIsSaving(true);

        try {
            let finalImage = formData.image;

            // 1. Upload if new file selected
            if (categoryFile) {
                toast.loading("Uploading category image...", { id: "cat-save" });
                const uploaded = await uploadToCloudinary(categoryFile, "products/categories");
                finalImage = { url: uploaded.url, publicId: uploaded.publicId };
            }

            const url = editingCategory
                ? `/api/products/categories/${editingCategory._id}`
                : "/api/products/categories";

            toast.loading("Saving category...", { id: "cat-save" });
            const res = await fetch(url, {
                method: editingCategory ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, image: finalImage })
            });

            if (res.ok) {
                toast.success(`Category ${editingCategory ? "updated" : "created"}!`, { id: "cat-save" });
                setIsModalOpen(false);
                fetchCategories();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save category", { id: "cat-save" });
            }
        } catch (err: any) {
            toast.error(err.message || "An error occurred", { id: "cat-save" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string) => {
        setCategoryToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/products/categories/${categoryToDelete}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Category deleted");
                setDeleteModalOpen(false);
                fetchCategories();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setDeleting(false);
            setCategoryToDelete(null);
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
            <DashboardHeader
                title="Product"
                highlight="Categories"
                subtitle="Manage Categories"
                description="Organize your catalog for better member browsing"
            >
                <div className="flex items-center gap-2 md:gap-3 relative z-10 w-full md:w-auto">
                    <Link href="/selling" className="flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-primary hover:text-black transition-all">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </Button>
                    </Link>
                    <Button
                        onClick={() => handleOpenModal()}
                        className="flex-1 md:flex-none h-10 md:h-12 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all px-4 md:px-8 shadow-2xl active:scale-95 text-[10px] md:text-sm"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 stroke-[3px]" />
                        New Category
                    </Button>
                </div>
            </DashboardHeader>

            {/* Filters */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                    placeholder="SEARCH CATEGORIES..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-10 md:h-12 pl-12 rounded-xl md:rounded-2xl bg-slate-950/20 border-white/5 focus:border-primary/50 transition-all font-black text-[9px] md:text-[10px] tracking-widest"
                />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-40 space-y-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Loading categories...</p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <Card className="glass-premium bg-slate-950/20 border-white/5 p-40 text-center border-dashed rounded-[40px]">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <Plus className="w-10 h-10 text-slate-700" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-400">No Categories Found</h3>
                    <p className="text-[10px] text-slate-500 mt-2 font-black uppercase tracking-widest">Start by creating your first product category.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {filteredCategories.map((category) => (
                        <Card key={category._id} className="glass-premium bg-slate-950/20 border-white/5 overflow-hidden group hover:border-primary/20 transition-all duration-700 rounded-[24px] md:rounded-3xl relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -skew-x-12 translate-x-16 -translate-y-8" />
                            <div className="p-6 md:p-8">
                                <div className="flex items-start justify-between mb-6 md:mb-8">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden border border-white/5 group-hover:border-primary/20 transition-all duration-500 shadow-2xl">
                                        {category.image?.url ? (
                                            <img src={category.image.url} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 md:w-7 md:h-7 text-slate-700 group-hover:text-primary transition-colors" />
                                        )}
                                    </div>
                                    <div className="flex gap-2 relative z-10">
                                        <Button
                                            onClick={() => handleOpenModal(category)}
                                            variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/5 hover:bg-primary hover:text-black transition-all"
                                        >
                                            <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </Button>
                                        <Button
                                            onClick={() => handleDelete(category._id)}
                                            variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-white/5 hover:bg-rose-500/10 hover:text-rose-500 text-slate-600 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    <div>
                                        <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter mb-1.5 md:mb-2 text-white group-hover:text-primary transition-colors truncate">{category.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                            <Badge variant="outline" className="bg-white/5 border-none text-[7px] md:text-[8px] font-black tracking-widest text-slate-500 uppercase px-2 md:px-3 py-1">
                                                {category.slug}
                                            </Badge>
                                            <div className="hidden sm:block w-1 h-1 rounded-full bg-slate-800" />
                                            <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {category.productCount || 0} Products
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.1em] leading-relaxed line-clamp-2 h-[28px] md:h-[30px]">
                                        {category.description || "NO DESCRIPTION PROVIDED FOR THIS CATEGORY."}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-full sm:max-w-2xl h-full sm:h-auto glass-premium bg-card border-white/10 p-0 overflow-hidden sm:rounded-[32px] shadow-2xl">
                    <DialogHeader className="p-6 md:p-10 pb-6 border-b border-white/5 bg-white/[0.02] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 translate-x-10" />
                        <div className="relative">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">Category Setup</span>
                                <div className="h-px w-12 md:w-20 bg-primary/20"></div>
                            </div>
                            <DialogTitle className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white">
                                {editingCategory ? "Update" : "New"} <span className="text-primary">Category</span>
                            </DialogTitle>
                            <DialogDescription className="text-[8px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                                Set up details for your product category
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <div className="space-y-2 md:space-y-4">
                            <div className="space-y-2.5 md:space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="E.G. SUPPLEMENTS"
                                    className="h-12 md:h-14 rounded-xl md:rounded-2xl tracking-wider"
                                />
                            </div>
                            <div className="space-y-2.5 md:space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Slug Identifier</label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="supplements"
                                    className="h-12 md:h-14 rounded-xl md:rounded-2xl tracking-wider"
                                />
                            </div>
                            <div className="space-y-2.5 md:space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="ENTER CATEGORY DESCRIPTION..."
                                    className="min-h-[100px] rounded-xl md:rounded-2xl bg-black/40 border-white/10 focus:border-primary/50  text-[10px] md:text-xs resize-none"
                                />
                            </div>
                            <div className="bg-primary/5 border border-primary/20 p-4 md:p-6 rounded-2xl flex gap-3 md:gap-4">
                                <Save className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0" />
                                <p className="text-[8px] md:text-[10px] font-medium text-primary/90 uppercase tracking-widest leading-relaxed">
                                    Slugs are used in API endpoints to fetch specific product collections.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center md:text-left block">Category Thumbnail</label>
                            <div className="aspect-square max-w-[200px] md:max-w-none mx-auto w-full">
                                <MediaUpload
                                    compact
                                    value={categoryFile || formData.image?.url}
                                    onChange={(file) => setCategoryFile(file)}
                                    onRemove={() => {
                                        setCategoryFile(null);
                                        setFormData({ ...formData, image: { url: "", publicId: "" } });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-10 pt-0 flex flex-row gap-3 md:gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 md:h-14 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-slate-500 hover:text-white text-[10px] md:text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-[2] h-12 md:h-14 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest px-4 md:px-8 hover:bg-primary transition-all shadow-2xl active:scale-95 text-[10px] md:text-xs"
                        >
                            {isSaving ? "SAVING..." : "SAVE CATEGORY"}
                            <Save className="w-4 h-4 md:w-5 md:h-5 ml-2 stroke-[3px]" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Delete"
                highlight="Category"
                description="Are you sure you want to delete this category? This will not delete the products within it, but they will become uncategorized."
                onConfirm={confirmDelete}
                loading={deleting}
                confirmText="Delete Category"
                variant="destructive"
            />
        </div>
    );
}
