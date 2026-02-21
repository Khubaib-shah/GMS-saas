"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";

export function NotificationSettings() {
    const [data, setData] = useState({
        sendExpiryReminder: true,
        sendInvoiceEmail: false,
        sendSMS: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/settings/notifications")
            .then(res => res.json())
            .then(res => {
                if (res.notifications) setData(prev => ({ ...prev, ...res.notifications }));
            })
            .catch(() => toast.error("Failed to load notification settings"))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/settings/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save");
            }
            toast.success("Notification settings saved");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-muted-foreground">Loading...</div>;

    return (
        <Card className="p-6 bg-card border-border/60 shadow-sm max-w-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
            </h3>
            <div className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                        <Label className="font-medium">Expiry Reminders</Label>
                        <p className="text-xs text-muted-foreground">Notify members before their subscription expires</p>
                    </div>
                    <Switch checked={data.sendExpiryReminder} onCheckedChange={v => setData({ ...data, sendExpiryReminder: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                        <Label className="font-medium">Invoice Emails</Label>
                        <p className="text-xs text-muted-foreground">Send email receipts after payments</p>
                    </div>
                    <Switch checked={data.sendInvoiceEmail} onCheckedChange={v => setData({ ...data, sendInvoiceEmail: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                        <Label className="font-medium">SMS Notifications</Label>
                        <p className="text-xs text-muted-foreground">Enable SMS notifications for members</p>
                    </div>
                    <Switch checked={data.sendSMS} onCheckedChange={v => setData({ ...data, sendSMS: v })} />
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
