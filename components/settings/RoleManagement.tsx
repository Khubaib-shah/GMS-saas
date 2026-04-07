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
import { Plus, Trash2, Edit2, Shield, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

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

    const fetchRoles = useCallback(async () => {
        try {
            const res = await fetch("/api/roles");
            if (!res.ok) throw new Error("Failed to fetch roles");
            const data = await res.json();
            setRoles(data.roles || []);
            setAllPermissions(data.allPermissions || []);
        } catch {
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

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

    const handleDelete = async (role: RoleData) => {
        if (role.isSystemRole) {
            toast.error("System roles cannot be deleted");
            return;
        }
        if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
        try {
            const res = await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to delete");
            }
            toast.success("Role deleted");
            fetchRoles();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    // Group permissions by category
    const groupedPermissions = allPermissions.reduce<Record<string, string[]>>((acc, perm) => {
        const category = perm.split(":")[0];
        if (!acc[category]) acc[category] = [];
        acc[category].push(perm);
        return acc;
    }, {});

    if (loading) return <div className="p-4 text-muted-foreground">Loading roles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Role Management
                    </h3>
                    <p className="text-sm text-muted-foreground">Create custom roles with granular permissions</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openCreate} className="gap-2">
                            <Plus className="w-4 h-4" /> New Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
                            <DialogDescription>
                                {editingRole?.isSystemRole
                                    ? "System role — you can only change permissions (except owner)."
                                    : "Define the role name and select permissions."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                            <InputField
                                label="Role Name"
                                validateType="text"
                                value={formData.name}
                                onChange={val => setFormData({ ...formData, name: val })}
                                placeholder="e.g. shift_supervisor"
                                disabled={editingRole?.isSystemRole}
                                required
                            />
                            <InputField
                                label="Description"
                                validateType="text"
                                value={formData.description}
                                onChange={val => setFormData({ ...formData, description: val })}
                                placeholder="What this role is for"
                            />

                            {/* Permission Matrix */}
                            <div className="space-y-3">
                                <Label className="text-base font-semibold">Permissions</Label>
                                {editingRole?.name === "owner" ? (
                                    <p className="text-sm text-muted-foreground italic">
                                        <Lock className="w-3 h-3 inline mr-1" />
                                        Owner always has all permissions. This cannot be changed.
                                    </p>
                                ) : (
                                    Object.entries(groupedPermissions).map(([category, perms]) => (
                                        <div key={category} className="space-y-2 p-3 rounded-lg bg-muted/30 border border-border/50">
                                            <p className="text-sm font-semibold capitalize text-foreground">{category}</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {perms.map(perm => (
                                                    <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer group">
                                                        <Checkbox
                                                            checked={formData.permissions.includes(perm)}
                                                            onCheckedChange={() => togglePermission(perm)}
                                                        />
                                                        <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                                                            {perm.split(":")[1]}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleSave} disabled={saving || editingRole?.name === "owner"}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                {editingRole ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No roles found. System roles will be created when you seed the database.
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map(role => (
                                <TableRow key={role.id}>
                                    <TableCell className="font-medium capitalize">{role.name}</TableCell>
                                    <TableCell>
                                        {role.isSystemRole ? (
                                            <Badge variant="secondary" className="text-xs"><Lock className="w-3 h-3 mr-1" />System</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs">Custom</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {role.name === "owner" ? "All permissions" : `${role.permissions.length} permissions`}
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(role)} disabled={role.name === "owner"}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(role)}
                                            disabled={role.isSystemRole}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
