"use client";

import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Folder,
    File,
    Image as ImageIcon,
    Video,
    Plus,
    Search,
    ChevronRight,
    Loader2,
    Check,
    Upload,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToCloudinary } from "@/lib/upload-utils";
import { toast } from "sonner";

// Global cache for gallery data to prevent redundant fetches
const galleryCache: Record<string, {
    assets: Asset[];
    folders: AssetFolder[];
    currentFolder: AssetFolder | null;
    timestamp: number;
}> = {};

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

interface Asset {
    _id: string;
    name: string;
    url: string;
    type: string;
    publicId: string;
    metadata?: any;
    isUploading?: boolean;
}

interface AssetFolder {
    _id: string;
    name: string;
    parentId: string | null;
    assetCount?: number;
}

interface AssetPickerProps {
    onSelect: (assets: any) => void; // Can be Asset or Asset[]
    trigger?: React.ReactNode;
    allowedTypes?: string[];
    multiple?: boolean;
}

export function AssetPicker({ onSelect, trigger, allowedTypes, multiple = false }: AssetPickerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [folders, setFolders] = useState<AssetFolder[]>([]);
    const [currentFolderId, setCurrentFolderId] = useState<string | null>("root");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
    const [currentFolder, setCurrentFolder] = useState<AssetFolder | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchGallery();
        }
    }, [isOpen, currentFolderId]);

    const fetchGallery = async (bypassCache = false) => {
        const cacheKey = `${currentFolderId}-${searchQuery}`;

        // Check cache
        if (!bypassCache && galleryCache[cacheKey]) {
            const cached = galleryCache[cacheKey];
            if (Date.now() - cached.timestamp < CACHE_DURATION) {
                setAssets(cached.assets);
                setFolders(cached.folders);
                setCurrentFolder(cached.currentFolder);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        try {
            const url = new URL("/api/gallery", window.location.origin);
            url.searchParams.append("folderId", currentFolderId || "root");
            if (searchQuery) url.searchParams.append("search", searchQuery);

            const res = await fetch(url.toString());
            if (res.ok) {
                const data = await res.json();
                const galleryData = {
                    assets: data.assets || [],
                    folders: data.folders || [],
                    currentFolder: data.currentFolder || null,
                    timestamp: Date.now()
                };

                setAssets(galleryData.assets);
                setFolders(galleryData.folders);
                setCurrentFolder(galleryData.currentFolder);

                // Update cache
                galleryCache[cacheKey] = galleryData;
            }
        } catch (error) {
            console.error("Failed to fetch gallery", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);
        setUploading(true);

        // Process each file
        const uploadPromises = filesArray.map(async (file) => {
            const tempId = Math.random().toString(36).substring(7);

            // 1. Add optimistic "uploading" asset
            const tempAsset: Asset = {
                _id: tempId,
                name: file.name,
                url: URL.createObjectURL(file), // Show local preview
                type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other",
                publicId: "",
                isUploading: true
            };
            setAssets(prev => [tempAsset, ...prev]);

            try {
                // 2. Upload to Cloudinary
                const cloudinaryResult = await uploadToCloudinary(file, "gallery");

                // 3. Register in our Gallery API
                const res = await fetch("/api/gallery/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: file.name,
                        url: cloudinaryResult.url,
                        publicId: cloudinaryResult.publicId,
                        type: tempAsset.type,
                        folderId: currentFolderId === "root" ? null : currentFolderId,
                        size: file.size,
                        metadata: { format: file.type }
                    })
                });

                if (res.ok) {
                    const newAsset = await res.json();
                    // Replace temp asset with real one
                    setAssets(prev => prev.map(a => a._id === tempId ? newAsset : a));
                    // Invalidate current folder cache
                    delete galleryCache[`${currentFolderId}-${searchQuery}`];
                    delete galleryCache[`${currentFolderId}-`];
                } else {
                    toast.error(`Failed to register ${file.name}`);
                    setAssets(prev => prev.filter(a => a._id !== tempId));
                }
            } catch (error) {
                toast.error(`Upload failed for ${file.name}`);
                setAssets(prev => prev.filter(a => a._id !== tempId));
            }
        });

        try {
            await Promise.all(uploadPromises);
            toast.success(`Upload sequence completed`);
        } finally {
            e.target.value = "";
            setUploading(false);
        }
    };

    const createFolder = async () => {
        const name = prompt("Enter folder name:");
        if (!name) return;

        try {
            const res = await fetch("/api/gallery/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    parentId: currentFolderId === "root" ? null : currentFolderId
                })
            });

            if (res.ok) {
                const newFolder = await res.json();
                setFolders(prev => [...prev, newFolder]);
                // Invalidate current folder cache
                delete galleryCache[`${currentFolderId}-${searchQuery}`];
                delete galleryCache[`${currentFolderId}-`];
                toast.success("Folder created!");
            }
        } catch (error) {
            console.error("Failed to create folder", error);
        }
    };

    const handleConfirmSelection = () => {
        if (selectedAssets.length > 0) {
            onSelect(multiple ? selectedAssets : selectedAssets[0]);
            setIsOpen(false);
            setSelectedAssets([]);
        }
    };

    const toggleAssetSelection = (asset: Asset) => {
        if (asset.isUploading) return;

        if (multiple) {
            setSelectedAssets(prev => {
                const isSelected = prev.find(a => a._id === asset._id);
                if (isSelected) {
                    return prev.filter(a => a._id !== asset._id);
                } else {
                    return [...prev, asset];
                }
            });
        } else {
            setSelectedAssets([asset]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Select Asset</Button>}
            </DialogTrigger>
            <DialogContent className="w-full sm:max-w-4xl h-full sm:h-[80vh] flex flex-col glass-premium border-white/10 p-0 overflow-hidden bg-slate-950/90 backdrop-blur-2xl">
                <DialogHeader className="p-4 md:p-6 border-b border-white/5 bg-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <DialogTitle className="text-lg md:text-xl font-black uppercase tracking-tighter text-white">Asset Gallery</DialogTitle>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 sm:flex-none rounded-xl h-9 bg-primary text-black font-bold uppercase tracking-widest text-[10px] hover:bg-white"
                                disabled={uploading}
                            >
                                {uploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                                Upload
                            </Button>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleUpload}
                                disabled={uploading}
                                multiple
                            />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={createFolder} 
                                className="flex-1 sm:flex-none rounded-xl h-9 bg-white/5 border-white/10 text-white font-bold uppercase tracking-widest text-[10px]"
                            >
                                <Plus className="w-3 h-3 mr-2" />
                                New Folder
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar / Navigation (Optional) */}

                    <div className="flex-1 flex flex-col">
                        {/* Toolbar */}
                        <div className="p-3 md:p-4 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 w-full sm:w-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentFolderId("root")}
                                    className={cn(
                                        "h-7 px-2 hover:bg-white/5 transition-colors",
                                        currentFolderId === "root" ? "text-white bg-white/10" : "text-slate-500"
                                    )}
                                >
                                    Gallery
                                </Button>
                                {currentFolderId !== "root" && (
                                    <>
                                        <ChevronRight className="w-3 h-3 text-slate-700" />
                                        <span className="text-white px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 truncate max-w-[150px]">
                                            {currentFolder?.name || "Loading..."}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <Input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search assets..."
                                    className="h-9 pl-10 rounded-xl bg-black/40 border-white/10 text-[10px]"
                                />
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Loading assets...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {/* Folders */}
                                    {folders.map(folder => (
                                        <div
                                            key={folder._id}
                                            onClick={() => setCurrentFolderId(folder._id)}
                                            className="group cursor-pointer aspect-square transition-all relative overflow-hidden flex flex-col items-center justify-center p-3"
                                        >
                                            <div className="relative w-full aspect-[3/2] cursor-pointer origin-bottom [perspective:1500px] z-10 scale-[0.85] -translate-y-2">
                                                <div className="bg-amber-600 w-full h-full origin-top rounded-xl rounded-tl-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,.4)] transition-all ease duration-300 relative 
                                                    after:absolute after:content-[''] after:bottom-[99%] after:left-0 after:w-1/3 after:h-2 after:bg-amber-600 after:rounded-t-lg
                                                    before:absolute before:content-[''] before:-top-[7px] before:left-[32%] before:w-3 before:h-3 before:bg-amber-600 before:[clip-path:polygon(0_35%,0%_100%,50%_100%);]"
                                                />
                                                {(folder.assetCount || 0) > 0 && (
                                                    <>
                                                        <div className="absolute inset-1 -top-2 bg-zinc-400 rounded-xl transition-all ease duration-300 origin-bottom select-none group-hover:[transform:rotateX(-20deg)]" />
                                                        <div className="absolute inset-1 -top-1.5 bg-zinc-300 rounded-xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-30deg)]" />
                                                        <div className="absolute inset-1 -top-1 bg-zinc-200 rounded-xl transition-all ease duration-300 origin-bottom group-hover:[transform:rotateX(-38deg)]" />
                                                    </>
                                                )}
                                                <div className="absolute bottom-0 bg-gradient-to-t from-amber-500 to-amber-400 w-full h-[90%] rounded-xl rounded-tr-none 
                                                    after:absolute after:content-[''] after:bottom-[99%] after:right-0 after:w-[70%] after:h-[10px] after:bg-amber-400 after:rounded-t-lg
                                                    before:absolute before:content-[''] before:-top-[8px] before:right-[68%] before:size-2 before:bg-amber-400 before:[clip-path:polygon(100%_14%,50%_100%,100%_100%);] 
                                                    transition-all ease duration-300 origin-bottom flex items-end group-hover:shadow-[inset_0_10px_20px_#fbbf24,inset_0_-10px_20px_#d97706] group-hover:[transform:rotateX(-46deg)_translateY(1px)]"
                                                />
                                            </div>
                                            <div className="absolute inset-x-0 bottom-0 p-2.5">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/70 truncate text-center group-hover:text-primary transition-colors">{folder.name}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Assets */}
                                    {assets.map(asset => (
                                        <div
                                            key={asset._id}
                                            onClick={() => toggleAssetSelection(asset)}
                                            className={cn(
                                                "group cursor-pointer aspect-square rounded-2xl bg-black/40 border transition-all relative overflow-hidden flex flex-col items-center justify-center gap-2",
                                                selectedAssets.some(a => a._id === asset._id) ? "border-primary ring-2 ring-primary/20" : "border-white/5 hover:border-white/20"
                                            )}
                                        >
                                            {/* ... existing asset rendering ... */}
                                            {asset.type === "image" ? (
                                                <div className="relative w-full h-full">
                                                    <img src={asset.url} className={cn("w-full h-full object-cover transition-opacity", asset.isUploading ? "opacity-30" : "opacity-80 group-hover:opacity-100")} />
                                                    {asset.isUploading && (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                            <span className="text-[8px] font-black uppercase text-white/50 tracking-widest">Uploading</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 relative">
                                                    {asset.isUploading ? (
                                                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                                                    ) : (
                                                        asset.type === "video" ? <Video className="w-6 h-6" /> : <File className="w-6 h-6" />
                                                    )}
                                                </div>
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/90 to-transparent">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/70 truncate text-center group-hover:text-primary transition-colors">{asset.name}</p>
                                            </div>

                                            {selectedAssets.some(a => a._id === asset._id) && (
                                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                                    <Check className="w-4 h-4 text-black stroke-[3px]" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selection Footer */}
                        <div className="p-4 border-t border-white/5 bg-black/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">
                                    {selectedAssets.length} Assets Selected
                                </p>
                                {selectedAssets.length > 0 && (
                                    <p className="text-[8px] font-bold text-primary uppercase tracking-tighter truncate max-w-[250px]">
                                        {selectedAssets.map(a => a.name).join(", ")}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                                <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 sm:flex-none rounded-xl h-10 px-4 md:px-6 font-black uppercase tracking-widest text-[10px] text-slate-400">Cancel</Button>
                                <Button
                                    onClick={handleConfirmSelection}
                                    disabled={selectedAssets.length === 0}
                                    className="flex-[2] sm:flex-none rounded-xl h-10 px-6 md:px-10 bg-primary text-black font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/10 hover:bg-white transition-all"
                                >
                                    Select {multiple ? `(${selectedAssets.length})` : ""}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
