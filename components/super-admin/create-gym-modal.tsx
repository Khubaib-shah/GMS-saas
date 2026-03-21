"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateGymModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateGymModal({ isOpen, onClose, onSuccess }: CreateGymModalProps) {
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        gymName: "",
        ownerName: "",
        ownerEmail: "",
        ownerPassword: "",
        planId: "",
        city: "",
        phone: "",
        address: "",
        trialDays: 14,
    });

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch("/api/platform/plans");
                const data = await res.json();
                setPlans(data.plans || []);
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            }
        };
        if (isOpen) fetchPlans();
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.planId) {
            toast.error("Please select a platform plan");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/super-admin/gyms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to create gym");
            }

            toast.success("Gym and Owner created successfully");
            onSuccess();
            onClose();
            setFormData({
                gymName: "",
                ownerName: "",
                ownerEmail: "",
                ownerPassword: "",
                planId: "",
                city: "",
                phone: "",
                address: "",
                trialDays: 14,
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#0d0d14] border-white/[0.08] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Create New Gym</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gymName">Gym Name *</Label>
                            <Input
                                id="gymName"
                                placeholder="Enter gym name"
                                required
                                value={formData.gymName}
                                onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08]"
                            />
                        </div>
                        <div className="space-y-2 w-full">
                            <Label htmlFor="planId">Platform Plan *</Label>
                            <Select
                                value={formData.planId}
                                onValueChange={(value) => setFormData({ ...formData, planId: value })}

                            >
                                <SelectTrigger className="bg-white/[0.04] border-white/[0.08] w-full">
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a24] border-white/[0.08] text-white">
                                    {plans.map((plan) => (
                                        <SelectItem key={plan._id} value={plan._id}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ownerName">Owner Name *</Label>
                            <Input
                                id="ownerName"
                                placeholder="Full name"
                                required
                                value={formData.ownerName}
                                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ownerEmail">Owner Email *</Label>
                            <Input
                                id="ownerEmail"
                                type="email"
                                placeholder="email@example.com"
                                required
                                value={formData.ownerEmail}
                                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ownerPassword">Owner Password *</Label>
                        <Input
                            id="ownerPassword"
                            type="password"
                            placeholder="Minimum 6 characters"
                            required
                            minLength={6}
                            value={formData.ownerPassword}
                            onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                            className="bg-white/[0.04] border-white/[0.08]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input
                                id="city"
                                placeholder="e.g. Karachi"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="e.g. 0300-1234567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="bg-white/[0.04] border-white/[0.08]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Full Address</Label>
                        <Input
                            id="address"
                            placeholder="Gym physical location"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="bg-white/[0.04] border-white/[0.08]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trialDays">Trial Period (Days)</Label>
                        <Input
                            id="trialDays"
                            type="number"
                            min="0"
                            placeholder="14"
                            value={formData.trialDays}
                            onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) || 0 })}
                            className="bg-white/[0.04] border-white/[0.08]"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-white/[0.08] hover:bg-white/[0.04]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Gym
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
