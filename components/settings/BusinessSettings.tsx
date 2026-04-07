"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
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
                    <InputField
                        label="Tax Percentage (%)"
                        validateType="number"
                        min={0}
                        max={100}
                        value={data.taxPercentage.toString()}
                        onChange={val => setData({ ...data, taxPercentage: parseFloat(val) || 0 })}
                    />
                    <InputField
                        label="Joining Fee"
                        validateType="number"
                        min={0}
                        value={data.joiningFee.toString()}
                        onChange={val => setData({ ...data, joiningFee: parseFloat(val) || 0 })}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Auto-Expire Days"
                        validateType="number"
                        min={0}
                        max={365}
                        value={data.autoExpireDays.toString()}
                        onChange={val => setData({ ...data, autoExpireDays: parseInt(val) || 0 })}
                        description="Days after which expired subscriptions are auto-archived (0 = disabled)"
                    />
                    <InputField
                        label="Grace Period Days"
                        validateType="number"
                        min={0}
                        max={90}
                        value={data.gracePeriodDays.toString()}
                        onChange={val => setData({ ...data, gracePeriodDays: parseInt(val) || 0 })}
                        description="Days after expiry before membership is suspended"
                    />
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
