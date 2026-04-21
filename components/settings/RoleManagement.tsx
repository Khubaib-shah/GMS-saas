"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit2, Shield, Loader2, Lock, Activity, Search } from "lucide-react";
import { toast } from "sonner";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface RoleData {
    id: string;
    name: string;
    permissions: string[];
    isSystemRole: boolean;
    description?: string;
}

export function RoleManagement() {
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [allPermissions, setAllPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleData | null>(null);
    const [formData, setFormData] = useState({ name: "", description: "", permissions: [] as string[] });
    const [saving, setSaving] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<RoleData | null>(null);

    // Cache key
    const CACHE_KEY = "gms_roles_cache";

    const fetchRoles = useCallback(async () => {
        try {
            const res = await fetch("/api/roles");
            if (!res.ok) throw new Error("Failed to fetch roles");
            const data = await res.json();
            setRoles(data.roles || []);
            setAllPermissions(data.allPermissions || []);
            
            // Update cache
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                roles: data.roles || [],
                allPermissions: data.allPermissions || []
            }));
        } catch {
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // 1. Try to load from cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setRoles(parsed.roles || []);
                setAllPermissions(parsed.allPermissions || []);
                setLoading(false);
            } catch (e) {
                console.error("Failed to parse cached roles", e);
            }
        }

        // 2. Fetch fresh data
        fetchRoles();
    }, [fetchRoles]);

    const openCreate = () => {
        setEditingRole(null);
        setFormData({ name: "", description: "", permissions: [] });
        setDialogOpen(true);
    };

    const openEdit = (role: RoleData) => {
        setEditingRole(role);
        setFormData({ name: role.name, description: role.description || "", permissions: [...role.permissions] });
        setDialogOpen(true);
    };

    const togglePermission = (perm: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm],
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const url = editingRole ? `/api/roles/${editingRole.id}` : "/api/roles";
            const method = editingRole ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save role");
            }
            toast.success(editingRole ? "Role updated" : "Role created");
            setDialogOpen(false);
            fetchRoles();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (role: RoleData) => {
        if (role.isSystemRole) {
            toast.error("System roles cannot be deleted");
            return;
        }
        setRoleToDelete(role);
    };

    const confirmDelete = async () => {
        if (!roleToDelete) return;
        try {
            const res = await fetch(`/api/roles/${roleToDelete.id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to delete");
            }
            toast.success("Role deleted");
            fetchRoles();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setRoleToDelete(null);
        }
    };

    // Group permissions by category
    const groupedPermissions = allPermissions.reduce<Record<string, string[]>>((acc, perm) => {
        if (!perm) return acc;
        const parts = perm.split(":");
        const category = parts[0] || "general";
        if (!acc[category]) acc[category] = [];
        acc[category].push(perm);
        return acc;
    }, {});

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                        AUTH <span className="text-primary">MATRICES</span>
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                        Granular permission control and role hierarchy
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "px-2 py-1 rounded-md text-[8px] font-black italic uppercase tracking-widest border transition-all duration-500",
                        loading ? "border-amber-500/20 bg-amber-500/5 text-amber-500 animate-pulse" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                    )}>
                        {loading ? "Syncing..." : "Synchronized"}
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                onClick={openCreate} 
                                className="h-10 px-6 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all uppercase text-xs rounded-lg neon-glow flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> NEW AUTHORITY
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] glass-premium border-white/10 bg-slate-950/90 backdrop-blur-2xl p-0 overflow-hidden">
                            <DialogHeader className="p-6 border-b border-white/5 bg-white/[0.02]">
                                <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-white">
                                    {editingRole ? "RESTRICT" : "INITIALIZE"} <span className="text-primary">AUTHORITY</span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                                    {editingRole?.isSystemRole
                                        ? "System-Locked Matrix: Modify permissions only"
                                        : "Custom Authority: Define name and access matrix"}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField
                                        label="Authority Identifier"
                                        validateType="text"
                                        value={formData.name}
                                        onChange={val => setFormData({ ...formData, name: val })}
                                        placeholder="e.g. shift_supervisor"
                                        disabled={editingRole?.isSystemRole}
                                        required
                                        className="bg-white/5 border-white/5"
                                    />
                                    <InputField
                                        label="Security Description"
                                        validateType="text"
                                        value={formData.description}
                                        onChange={val => setFormData({ ...formData, description: val })}
                                        placeholder="Purpose of this access level"
                                        className="bg-white/5 border-white/5"
                                    />
                                </div>

                                {/* Permission Matrix */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full"></div>
                                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Permission Access Matrix</Label>
                                    </div>
                                    
                                    {editingRole?.name === "owner" ? (
                                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4">
                                            <Lock className="w-8 h-8 text-primary animate-pulse" />
                                            <div>
                                                <p className="text-[11px] font-black italic text-white uppercase tracking-tighter">UNRESTRICTED OVERRIDE</p>
                                                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">The Owner role has hard-coded access to all system modules.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {Object.entries(groupedPermissions).map(([category, perms]) => (
                                                <div key={category} className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group/cat hover:border-white/10 transition-colors">
                                                    <p className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 group-hover/cat:text-primary transition-colors">{category} Module</p>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {perms.map(perm => (
                                                            <label key={perm} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-all active:scale-95 group/perm">
                                                                <Checkbox
                                                                    checked={formData.permissions.includes(perm)}
                                                                    onCheckedChange={() => togglePermission(perm)}
                                                                    className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                />
                                                                <span className="text-[10px] font-bold text-slate-400 group-hover/perm:text-white uppercase tracking-tighter transition-colors">
                                                                    {(perm.split(":")[1] || perm).replace(/_/g, " ")}
                                                                </span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="p-6 border-t border-white/5 bg-white/[0.01]">
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setDialogOpen(false)}
                                    className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 hover:text-white"
                                >
                                    ABORT
                                </Button>
                                <Button 
                                    onClick={handleSave} 
                                    disabled={saving || editingRole?.name === "owner"}
                                    className="h-10 px-8 rounded-xl bg-primary text-black hover:bg-white font-black italic tracking-tighter transition-all uppercase text-xs neon-glow"
                                >
                                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    COMMIT AUTHORITY
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="glass-premium border-white/5 bg-slate-950/20 backdrop-blur-xl overflow-hidden rounded-2xl border-t-0 relative after:absolute after:top-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent">
                <Table>
                    <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-b border-white/5 hover:bg-transparent">
                            <TableHead className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 h-14 pl-6">Identifier</TableHead>
                            <TableHead className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 h-14">Protocol Type</TableHead>
                            <TableHead className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 h-14">Access Matrix</TableHead>
                            <TableHead className="text-[10px] font-black italic uppercase tracking-widest text-slate-500 h-14 text-right pr-6">Override</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && roles.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-b border-white/5 hover:bg-transparent">
                                    <TableCell className="py-5 pl-6"><Skeleton className="h-4 w-32 bg-white/5" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 bg-white/5 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 bg-white/5" /></TableCell>
                                    <TableCell className="text-right pr-6"><Skeleton className="h-8 w-8 ml-auto bg-white/5 rounded-lg" /></TableCell>
                                </TableRow>
                            ))
                        ) : roles.length === 0 ? (
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableCell colSpan={4} className="h-32 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic">
                                    NO AUTHORITY PROFILES DETECTED.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map(role => (
                                <TableRow key={role.id} className="border-b border-white/5 hover:bg-white/[0.02] group/row transition-colors">
                                    <TableCell className="py-5 pl-6">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black italic text-white uppercase tracking-tighter">{role.name}</span>
                                            {role.description && <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">{role.description}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {role.isSystemRole ? (
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black italic uppercase tracking-widest">
                                                <Lock className="w-2.5 h-2.5 mr-1" /> CORE
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[8px] font-black italic uppercase tracking-widest">
                                                MODIFIED
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-[10px] font-mono text-slate-400">
                                            {role.name === "owner" ? (
                                                <span className="text-primary italic font-black uppercase">FULL ACCESS</span>
                                            ) : (
                                                <span className="uppercase tracking-tighter font-bold">{role.permissions.length} NODES MAPPED</span>
                                            )}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2 pr-6">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => openEdit(role)} 
                                            disabled={role.name === "owner"}
                                            className="h-8 w-8 rounded-lg border border-white/5 bg-white/[0.02] text-slate-500 hover:text-white hover:border-white/10 transition-all opacity-0 group-hover/row:opacity-100"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(role)}
                                            disabled={role.isSystemRole}
                                            className="h-8 w-8 rounded-lg border border-red-500/10 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover/row:opacity-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <ConfirmationModal
                isOpen={!!roleToDelete}
                onClose={() => setRoleToDelete(null)}
                onConfirm={confirmDelete}
                title="TERMINATE AUTHORITY"
                description={`Are you sure you want to completely erase the "${roleToDelete?.name}" access matrix? Users bound to this identifier will lose all derived privileges.`}
                confirmText="CONFIRM DELETION"
            />
        </div>
    );
}
