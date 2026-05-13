"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { AssetPicker } from "@/components/gallery/asset-picker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, FolderOpen, Upload, Plus } from "lucide-react";

export default function GalleryPage() {
    return (
        <div className="mx-auto p-8 space-y-10 animate-in slide-in-from-bottom-4 duration-700 pb-20">
            <DashboardHeader 
                title="ASSET" 
                highlight="GALLERY"
                subtitle="Media & Content Management"
                description="Organize, upload, and maintain your digital assets in one central location."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="glass-premium bg-slate-950/20 border-white/5 p-10 flex flex-col items-center justify-center gap-6 rounded-[32px] group hover:border-primary/20 transition-all">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <FolderOpen className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Manage Library</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">
                            BROWSE FOLDERS, RENAME ASSETS,<br />AND ORGANIZE YOUR MEDIA
                        </p>
                    </div>
                    <AssetPicker 
                        onSelect={(asset) => console.log("Selected from main gallery", asset)}
                        trigger={
                            <Button className="h-12 px-10 rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all shadow-2xl">
                                OPEN GALLERY
                            </Button>
                        }
                    />
                </Card>

                <Card className="glass-premium bg-slate-950/20 border-white/5 p-10 flex flex-col items-center justify-center gap-6 rounded-[32px] group hover:border-primary/20 transition-all">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <Upload className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Quick Upload</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">
                            DRAG AND DROP NEW ASSETS<br />DIRECTLY INTO THE ROOT FOLDER
                        </p>
                    </div>
                    <Button variant="outline" className="h-12 px-10 rounded-2xl bg-white/5 border-white/10 text-white font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-black transition-all">
                        UPLOAD FILES
                    </Button>
                </Card>

                <Card className="glass-premium bg-slate-950/20 border-white/5 p-10 flex flex-col items-center justify-center gap-6 rounded-[32px] group hover:border-primary/20 transition-all opacity-50 grayscale cursor-not-allowed">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500">
                        <Plus className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-black uppercase tracking-tighter text-white">Coming Soon</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 leading-relaxed">
                            IMAGE OPTIMIZATION &<br />BULK ACTIONS
                        </p>
                    </div>
                </Card>
            </div>

            {/* Quick Stats or Recently Added could go here */}
        </div>
    );
}
