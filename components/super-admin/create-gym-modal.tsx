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
import { InputField } from "@/components/ui/input-field";
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

        // 1. Validation Logic Using Switch
        const validate = () => {
            const fields = [
                "gymName",
                "planId",
                "ownerName",
                "ownerEmail",
                "ownerPassword",
                "city",
                "phone",
                "address",
            ];

            for (const field of fields) {
                const value = (formData as any)[field];
                if (!value || (typeof value === "string" && !value.trim())) {
                    switch (field) {
                        case "gymName":
                            return "A name for your gym is required.";
                        case "planId":
                            return "Please select a subscription plan.";
                        case "ownerName":
                            return "Owner's full name is required.";
                        case "ownerEmail":
                            return "Owner's email address is required.";
                        case "ownerPassword":
                            return "Please set an owner password.";
                        case "city":
                            return "Gym city location is required.";
                        case "phone":
                            return "A contact phone number is required.";
                        case "address":
                            return "Physical address of the gym is required.";
                        default:
                            return `Please fill in all required fields.`;
                    }
                }
            }

            // Specific Format Checks
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.ownerEmail)) {
                return "The owner email address format is invalid.";
            }

            if (formData.ownerPassword.length < 6) {
                return "Owner password must be at least 6 characters long.";
            }

            return null;
        };

        const error = validate();
        if (error) {
            toast.error(error);
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
            <DialogContent className="sm:max-w-[500px] bg-[#0d0d14] border-white/8 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Create New Gym</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Gym Name"
                            validateType="text"
                            placeholder="Enter gym name"
                            required
                            value={formData.gymName}
                            onChange={(val) => setFormData({ ...formData, gymName: val })}
                        />
                        <div className="space-y-2 w-full">
                            <Label htmlFor="planId">Platform Plan *</Label>
                            <Select
                                value={formData.planId}
                                onValueChange={(value) => setFormData({ ...formData, planId: value })}

                            >
                                <SelectTrigger className="bg-white/4 border-white/8 w-full">
                                    <SelectValue placeholder="Select plan" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1a1a24] border-white/8 text-white">
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
                        <InputField
                            label="Owner Name"
                            validateType="text"
                            placeholder="Full name"
                            required
                            value={formData.ownerName}
                            onChange={(val) => setFormData({ ...formData, ownerName: val })}
                        />
                        <InputField
                            label="Owner Email"
                            validateType="email"
                            placeholder="email@example.com"
                            required
                            value={formData.ownerEmail}
                            onChange={(val) => setFormData({ ...formData, ownerEmail: val })}
                        />
                    </div>

                    <InputField
                        label="Owner Password"
                        validateType="password"
                        placeholder="Minimum 6 characters"
                        required
                        minLength={6}
                        value={formData.ownerPassword}
                        onChange={(val) => setFormData({ ...formData, ownerPassword: val })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="City"
                            validateType="text"
                            placeholder="e.g. Karachi"
                            value={formData.city}
                            onChange={(val) => setFormData({ ...formData, city: val })}
                        />
                        <InputField
                            label="Phone"
                            validateType="phone"
                            placeholder="e.g. 03001234567"
                            value={formData.phone}
                            onChange={(val) => setFormData({ ...formData, phone: val })}
                        />
                    </div>

                    <InputField
                        label="Full Address"
                        validateType="text"
                        placeholder="Gym physical location"
                        value={formData.address}
                        onChange={(val) => setFormData({ ...formData, address: val })}
                    />

                    <InputField
                        label="Trial Period (Days)"
                        validateType="number"
                        min="0"
                        placeholder="14"
                        value={formData.trialDays.toString()}
                        onChange={(val) => setFormData({ ...formData, trialDays: parseInt(val) || 0 })}
                    />

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-white/8 hover:bg-white/4"
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
