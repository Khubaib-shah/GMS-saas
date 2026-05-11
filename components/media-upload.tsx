"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, FileVideo, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MediaUploadProps {
    value?: string | File | null;
    onChange: (file: File | null) => void;
    onRemove?: () => void;
    accept?: string;
    label?: string; // Optional label
    description?: string;
    disabled?: boolean;
    compact?: boolean;
}

export function MediaUpload({
    value,
    onChange,
    onRemove,
    accept = "video/*,.svg,image/*",
    label,
    description,
    disabled,
    compact = false
}: MediaUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Update preview when value changes
    useEffect(() => {
        if (!value) {
            setPreviewUrl(null);
            return;
        }

        if (typeof value === "string") {
            setPreviewUrl(value);
        } else if (value instanceof File) {
            const url = URL.createObjectURL(value);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [value]);

    const isVideo = (val: string | File | null | undefined) => {
        if (!val) return false;
        if (typeof val === "string") {
            return val.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || val.includes("/video/upload/");
        }
        return val.type.startsWith("video/");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onChange(file);
        }
    };

    const hasValue = !!value;
    const isValueVideo = isVideo(value);

    return (
        <div className={cn("space-y-2.5 w-full h-full flex flex-col", compact && "space-y-0")}>
            {label && (
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                    {label}
                </label>
            )}

            <div
                className={cn(
                    "relative group cursor-pointer transition-all duration-500 rounded-2xl border-2 border-dashed overflow-hidden flex-1 flex items-center justify-center",
                    hasValue
                        ? "border-primary/40 bg-primary/5"
                        : "border-white/10 bg-white/2 hover:border-primary/30 hover:bg-white/5",
                    compact ? "min-h-0 aspect-square" : "min-h-[160px]",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    onChange={handleFileChange}
                />

                {hasValue && previewUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-black/20">
                        {isValueVideo ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                                <video
                                    src={previewUrl}
                                    className="w-full h-full object-contain rounded-lg"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                                {!compact && (
                                    <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-primary/30 flex items-center justify-center leading-none">
                                        <span className="text-[7px] font-semibold text-primary uppercase tracking-wider">Video Selected</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain drop-shadow-2xl" />
                                {!compact && (
                                    <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-primary/30 flex items-center justify-center leading-none">
                                        <span className="text-[7px] font-black text-primary uppercase tracking-wider">Image Selected</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm p-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className={cn(
                                    "font-black uppercase text-white hover:bg-white/10 rounded-lg tracking-widest",
                                    compact ? "h-7 px-2 text-[7px]" : "h-8 px-4 text-[9px]"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                            >
                                {compact ? "Edit" : "Change"}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                className={cn(
                                    "font-black uppercase text-destructive hover:bg-destructive/10 rounded-lg tracking-widest",
                                    compact ? "h-7 px-2 text-[7px]" : "h-8 px-4 text-[9px]"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove ? onRemove() : onChange(null);
                                }}
                            >
                                <X className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3 mr-2 mb-0.5")} />
                                {!compact && "Remove"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "p-4 space-y-2" : "p-10 space-y-4")}>
                        <div className={cn(
                            "rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 group-hover:text-primary group-hover:border-primary/20 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] transition-all",
                            compact ? "w-10 h-10" : "w-14 h-14"
                        )}>
                            <Upload className={cn(compact ? "w-5 h-5" : "w-7 h-7")} />
                        </div>
                        <div className="text-center">
                            <p className={cn("font-black text-white uppercase tracking-widest mb-1", compact ? "text-[8px]" : "text-[10px]")}>
                                {compact ? "Add Asset" : "Click to Select Media"}
                            </p>
                            {!compact && (
                                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                                    {description || "Deferred upload on form submit"}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
