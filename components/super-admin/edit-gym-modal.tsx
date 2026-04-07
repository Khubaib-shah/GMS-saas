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

interface EditGymModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    gym: any;
}

export function EditGymModal({ isOpen, onClose, onSuccess, gym }: EditGymModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        city: "",
        phone: "",
        address: "",
        trialEndsAt: "",
        expiryDate: "",
        subscriptionStatus: "",
    });

    useEffect(() => {
        if (gym) {
            setFormData({
                name: gym.name || "",
                city: gym.city || "",
                phone: gym.phone || "",
                address: gym.address || "",
                trialEndsAt: gym.trialEndsAt ? new Date(gym.trialEndsAt).toISOString().split('T')[0] : "",
                expiryDate: gym.expiryDate ? new Date(gym.expiryDate).toISOString().split('T')[0] : "",
                subscriptionStatus: gym.subscriptionStatus || "",
            });
        }
    }, [gym, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`/api/super-admin/gyms/${gym.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to update gym");
            }

            toast.success("Gym updated successfully");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-[#0d0d14] border-white/8 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Edit Gym Details</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <InputField
                        label="Gym Name"
                        validateType="text"
                        value={formData.name}
                        onChange={(val) => setFormData({ ...formData, name: val })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="City"
                            validateType="text"
                            value={formData.city}
                            onChange={(val) => setFormData({ ...formData, city: val })}
                        />
                        <InputField
                            label="Phone"
                            validateType="phone"
                            value={formData.phone}
                            onChange={(val) => setFormData({ ...formData, phone: val })}
                        />
                    </div>

                    <InputField
                        label="Address"
                        validateType="text"
                        value={formData.address}
                        onChange={(val) => setFormData({ ...formData, address: val })}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            label="Trial Ends At"
                            validateType="text"
                            type="date"
                            value={formData.trialEndsAt}
                            onChange={(val) => setFormData({ ...formData, trialEndsAt: val })}
                        />
                        <InputField
                            label="Subscription Expiry"
                            validateType="text"
                            type="date"
                            value={formData.expiryDate}
                            onChange={(val) => setFormData({ ...formData, expiryDate: val })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subscriptionStatus">Subscription Status</Label>
                        <Select
                            value={formData.subscriptionStatus}
                            onValueChange={(value) => setFormData({ ...formData, subscriptionStatus: value })}
                        >
                        <SelectTrigger className="bg-white/4 border-white/8 w-full">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a24] border-white/8 text-white">
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

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
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
