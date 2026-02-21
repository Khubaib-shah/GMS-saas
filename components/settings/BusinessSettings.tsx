"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function BusinessSettings() {
    const [data, setData] = useState({
        taxPercentage: 0,
        joiningFee: 0,
        autoExpireDays: 0,
        gracePeriodDays: 0,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/settings/business")
            .then(res => res.json())
            .then(res => {
                if (res.business) setData(prev => ({ ...prev, ...res.business }));
            })
            .catch(() => toast.error("Failed to load business settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/business", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }
            toast.success("Business settings saved");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;

    return (
        <Card className="p-6 bg-card border-border/60 shadow-sm max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Business Settings</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Tax Percentage (%)</Label>
                        <Input type="number" min={0} max={100} value={data.taxPercentage} onChange={e => setData({ ...data, taxPercentage: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Joining Fee</Label>
                        <Input type="number" min={0} value={data.joiningFee} onChange={e => setData({ ...data, joiningFee: parseFloat(e.target.value) || 0 })} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Auto-Expire Days</Label>
                        <Input type="number" min={0} max={365} value={data.autoExpireDays} onChange={e => setData({ ...data, autoExpireDays: parseInt(e.target.value) || 0 })} />
                        <p className="text-xs text-muted-foreground">Days after which expired subscriptions are auto-archived (0 = disabled)</p>
                    </div>
                    <div className="space-y-2">
                        <Label>Grace Period Days</Label>
                        <Input type="number" min={0} max={90} value={data.gracePeriodDays} onChange={e => setData({ ...data, gracePeriodDays: parseInt(e.target.value) || 0 })} />
                        <p className="text-xs text-muted-foreground">Days after expiry before membership is suspended</p>
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
