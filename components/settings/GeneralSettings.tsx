"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
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
                    <InputField
                        label="Gym Name"
                        validateType="text"
                        value={data.name}
                        onChange={val => setData({ ...data, name: val })}
                        placeholder="My Gym"
                    />
                    <InputField
                        label="Currency"
                        validateType="text"
                        value={data.currency}
                        onChange={val => setData({ ...data, currency: val })}
                        placeholder="USD"
                    />
                </div>
                <InputField
                    label="Address"
                    validateType="text"
                    value={data.address}
                    onChange={val => setData({ ...data, address: val })}
                    placeholder="123 Main St"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="Timezone"
                        validateType="text"
                        value={data.timezone}
                        onChange={val => setData({ ...data, timezone: val })}
                        placeholder="UTC"
                    />
                    <InputField
                        label="Logo URL"
                        validateType="text"
                        value={data.logo}
                        onChange={val => setData({ ...data, logo: val })}
                        placeholder="https://..."
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
