"use client";

import { useState, useEffect } from "react";
import {
    Key,
    Plus,
    Copy,
    Trash2,
    Eye,
    EyeOff,
    AlertCircle,
    ShieldCheck,
    Zap,
    ChevronLeft,
    Loader2,
    Check
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DashboardHeader } from "@/components/dashboard-header";
import Link from "next/link";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function ApiKeysManagement() {
    const [keys, setKeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newKeyData, setNewKeyData] = useState<any>(null);
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [newKeyName, setNewKeyName] = useState("");
    const [copying, setCopying] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [keyToDelete, setKeyToDelete] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        try {
            const res = await fetch("/api/selling/api-keys");
            const data = await res.json();
            if (Array.isArray(data)) setKeys(data);
        } catch (err) {
            toast.error("Failed to load API keys");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteKey = (id: string) => {
        setKeyToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!keyToDelete) return;
        setDeleting(true);

        try {
            const res = await fetch(`/api/selling/api-keys/${keyToDelete}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("API Key deleted");
                setDeleteModalOpen(false);
                fetchKeys();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete key");
            }
        } catch (err) {
            toast.error("An error occurred while deleting");
        } finally {
            setDeleting(false);
            setKeyToDelete(null);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName) return toast.error("Please enter a name for the key");

        try {
            const res = await fetch("/api/selling/api-keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();
            if (res.ok) {
                setNewKeyData(data);
                setShowKeyModal(true);
                setNewKeyName("");
                fetchKeys();
                toast.success("API Key generated!");
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error("Failed to generate key");
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopying(type);
        toast.success(`${type} copied to clipboard`);
        setTimeout(() => setCopying(null), 2000);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-5xl mx-auto">
            <DashboardHeader
                title="Headless"
                highlight="APIs"
                subtitle="Security Center"
                description="Securely connect your gym catalog to external websites and apps"
            >
                <div className="relative z-10">
                    <Link href="/selling">
                        <Button variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-primary hover:text-black transition-all">
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </Button>
                    </Link>
                </div>
            </DashboardHeader>

            {/* Create New Key Section */}
            <Card className="glass-premium bg-slate-950/20 border-white/5 p-6 md:p-10 rounded-[24px] md:rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 -skew-x-12 translate-x-10" />
                <div className="relative flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
                    <div className="flex-1 space-y-2.5 md:space-y-3 w-full">
                        <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">New API Key Name</label>
                        <Input
                            value={newKeyName}
                            onChange={e => setNewKeyName(e.target.value)}
                            placeholder="E.G. WORDPRESS STOREFRONT"
                            className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-black/40 border-white/10 focus:border-primary/50 transition-all font-black uppercase text-[10px] md:text-xs tracking-widest px-4 md:px-6"
                        />
                    </div>
                    <Button
                        onClick={handleCreateKey}
                        className="h-12 md:h-14 rounded-xl md:rounded-2xl bg-primary text-black font-black uppercase tracking-widest hover:bg-white transition-all px-6 md:px-10 shadow-2xl active:scale-95 w-full md:w-auto text-[10px] md:text-sm"
                    >
                        <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 stroke-[3px]" />
                        Generate Key
                    </Button>
                </div>
            </Card>

            <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Active API Keys</span>
                    <div className="h-px flex-1 bg-white/5"></div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                ) : keys.length === 0 ? (
                    <Card className="glass-premium bg-slate-950/20 border-white/5 p-20 text-center rounded-3xl">
                        <AlertCircle className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No API keys generated yet</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {keys.map((key) => (
                            <Card key={key._id} className="glass-premium bg-slate-950/20 border-white/5 p-6 md:p-8 hover:bg-white/[0.02] hover:border-primary/20 transition-all duration-500 rounded-[20px] md:rounded-2xl group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-black transition-all duration-500 shadow-2xl shrink-0">
                                            <Key className="w-6 h-6 md:w-7 md:h-7" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-black uppercase tracking-tighter text-lg md:text-xl text-white mb-1 leading-none truncate">{key.name}</h4>
                                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                                <code className="text-[9px] md:text-[10px] text-slate-500 font-mono tracking-tighter bg-black/40 px-2 py-0.5 rounded border border-white/5 truncate max-w-[120px] md:max-w-none">{key.keyId}</code>
                                                <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 leading-none">ACTIVE</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8">
                                        <div className="text-left md:text-right">
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-0.5 md:mb-1">Last Used</span>
                                            <span className="text-[10px] md:text-[11px] font-black text-slate-300 uppercase tracking-widest">
                                                {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'NEVER'}
                                            </span>
                                        </div>
                                        <div className="text-left md:text-right">
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest block mb-0.5 md:mb-1">Usage</span>
                                            <span className="text-[10px] md:text-[11px] font-black text-primary uppercase tracking-widest">{key.usageCount || 0} REQS</span>
                                        </div>
                                        <Button 
                                            onClick={() => handleDeleteKey(key._id)}
                                            variant="ghost" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-lg md:rounded-xl bg-white/2 hover:bg-rose-500/10 hover:text-rose-500 text-slate-700 transition-all shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Secret Key Modal (Persistent Overlay) */}
            {showKeyModal && newKeyData && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <Card className="max-w-2xl w-full bg-slate-900 border-primary/30 p-6 md:p-8 space-y-6 md:space-y-8 animate-in zoom-in-95 duration-300 rounded-[24px] md:rounded-3xl">
                        <div className="flex items-center gap-3 md:gap-4 text-primary">
                            <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 shrink-0" />
                            <div>
                                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter">Secure API Credentials</h2>
                                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">Save these credentials now. They will not be shown again.</p>
                            </div>
                        </div>

                        <div className="space-y-4 md:space-y-6">
                            {[
                                { label: "Key ID (Public)", value: newKeyData.keyId, type: "Key ID" },
                                { label: "API Key (X-API-Key)", value: newKeyData.apiKey, type: "API Key" },
                                { label: "API Secret (X-API-Secret)", value: newKeyData.apiSecret, type: "API Secret" },
                            ].map((item) => (
                                <div key={item.type} className="space-y-2">
                                    <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</label>
                                    <div className="flex gap-2">
                                        <Input readOnly value={item.value} className="bg-black/40 border-white/10 font-mono text-[10px] md:text-sm h-10 md:h-12" />
                                        <Button onClick={() => copyToClipboard(item.value, item.type)} variant="outline" className="h-10 w-10 md:h-12 md:w-12 border-white/10 shrink-0">
                                            {copying === item.type ? <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> : <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-rose-500/10 border border-rose-500/20 p-3 md:p-4 rounded-xl flex gap-3">
                            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-rose-500 shrink-0" />
                            <p className="text-[8px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest leading-relaxed">
                                If you lose these keys, you will have to generate a new pair. GMS-SaaS does not store raw secrets for security.
                            </p>
                        </div>

                        <Button
                            onClick={() => setShowKeyModal(false)}
                            className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl bg-white text-black font-black uppercase tracking-widest hover:bg-primary transition-all text-[10px] md:text-sm"
                        >
                            I Have Saved the Keys
                        </Button>
                    </Card>
                </div>
            )}

            <ConfirmModal
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
                title="Revoke"
                highlight="API Key"
                description="Are you sure you want to revoke this API Key? Any external applications using this key will immediately lose access to your catalog."
                onConfirm={confirmDelete}
                loading={deleting}
                confirmText="Revoke Access"
                variant="destructive"
            />
        </div>
    );
}
