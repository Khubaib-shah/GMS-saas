"use client";

import { useState, useRef } from "react";
import { Upload, X, FileVideo, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MediaUploadProps {
    value?: string;
    onChange: (url: string, type: "image" | "video") => void;
    onRemove?: () => void;
    accept?: string;
    label: string;
    folder?: string;
    description?: string;
    disabled?: boolean;
}

export function MediaUpload({
    value,
    onChange,
    onRemove,
    accept = "video/*,.svg,image/*",
    label,
    folder = "general",
    description,
    disabled
}: MediaUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to determine if a URL/File is a video
    const isVideoFile = (fileOrUrl: string | File) => {
        if (typeof fileOrUrl === "string") {
            // Case-insensitive check for common video extensions and Cloudinary resource types
            return (
                fileOrUrl.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || 
                fileOrUrl.includes("/video/upload/") ||
                fileOrUrl.includes("resource_type=video") ||
                fileOrUrl.startsWith("data:video/")
            );
        }
        return fileOrUrl.type.startsWith("video/");
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const isVideo = isVideoFile(file);
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);
            formData.append("resourceType", isVideo ? "video" : "auto");

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.url) {
                // Use the server-confirmed resourceType (video or image)
                const detectedType = data.resourceType === "video" ? "video" : "image";
                onChange(data.url, detectedType);
                toast.success(`${detectedType === "video" ? "Video" : "Image"} uploaded successfully`);
            } else {
                throw new Error(data.error || "Upload failed");
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            toast.error(error.message || "Failed to upload file.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const hasValue = !!value;
    const isValueVideo = hasValue && isVideoFile(value);

    return (
        <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                {label}
            </label>

            <div
                className={cn(
                    "relative group cursor-pointer transition-all duration-500 rounded-2xl border-2 border-dashed overflow-hidden min-h-[160px] flex items-center justify-center",
                    hasValue
                        ? "border-primary/40 bg-primary/5"
                        : "border-white/10 bg-white/2 hover:border-primary/30 hover:bg-white/5",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                    uploading && "pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    onChange={handleUpload}
                />

                {uploading ? (
                    <div className="flex flex-col items-center justify-center p-8 space-y-3">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Uploading to Cloud...</p>
                    </div>
                ) : hasValue ? (
                    <div className="relative w-full h-full min-h-[160px] flex items-center justify-center bg-black/20">
                        {isValueVideo ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                                <video
                                    src={value}
                                    className="w-full max-h-[140px] object-contain rounded-lg"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                                <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-primary/30 flex items-center justify-center leading-none">
                                    <span className="text-[7px] font-semibold text-primary uppercase tracking-wider">Video Preview</span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img src={value} alt="Preview" className="max-w-full max-h-[140px] object-contain drop-shadow-2xl" />
                                <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-primary/30 flex items-center justify-center leading-none">
                                    <span className="text-[7px] font-black text-primary uppercase tracking-wider">SVG / Image</span>
                                </div>
                            </div>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                             <Button
                                size="sm"
                                variant="ghost"
                                className="text-[9px] font-black uppercase text-white hover:bg-white/10 h-8 rounded-lg flex items-center justify-center leading-none tracking-widest px-4"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                Change
                            </Button>
                             <Button
                                size="sm"
                                variant="ghost"
                                className="text-[9px] font-black uppercase text-destructive hover:bg-destructive/10 h-8 rounded-lg flex items-center justify-center leading-none tracking-widest px-4"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove ? onRemove() : onChange("", "image");
                                }}
                            >
                                <X className="w-3 h-3 mr-2 mb-0.5" />
                                Remove
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-10 space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:border-primary/20 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] transition-all">
                            <Upload className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">
                                Click to Upload Demo
                            </p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                {description || "Supports SVG, MP4, MOV, WEBM"}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
