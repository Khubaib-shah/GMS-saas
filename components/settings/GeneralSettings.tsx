"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function GeneralSettings() {
    const [data, setData] = useState({
        name: "",
        logo: "",
        address: "",
        timezone: "UTC",
        currency: "USD",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/settings/general")
            .then(res => res.json())
            .then(res => {
                if (res.general) setData(prev => ({ ...prev, ...res.general }));
            })
            .catch(() => toast.error("Failed to load general settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/general", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }
            toast.success("General settings saved");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;

    return (
        <Card className="p-6 bg-card border-border/60 shadow-sm max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">General Settings</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Gym Name</Label>
                        <Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} placeholder="My Gym" />
                    </div>
                    <div className="space-y-2">
                        <Label>Currency</Label>
                        <Input value={data.currency} onChange={e => setData({ ...data, currency: e.target.value })} placeholder="USD" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={data.address} onChange={e => setData({ ...data, address: e.target.value })} placeholder="123 Main St" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Input value={data.timezone} onChange={e => setData({ ...data, timezone: e.target.value })} placeholder="UTC" />
                    </div>
                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input value={data.logo} onChange={e => setData({ ...data, logo: e.target.value })} placeholder="https://..." />
                    </div>
                </div>
                <div className="pt-4 border-t border-border">
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </Card>
    );
}
