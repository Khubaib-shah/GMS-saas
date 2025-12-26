"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Upload } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { fileToBase64 } from "@/lib/utils/file-utils";
import { toast } from "sonner";

export default function AddMemberPage() {
  const router = useRouter();
  const store = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: "male" | "female" | "other";
    planId: string;
    notes: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "male",
    planId: "plan_basic",
    notes: "",
  });

  useEffect(() => {
    store.loadPlans();
  }, [store.members]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setPhotoBase64(base64);
      setPhotoPreview(base64);
    } catch (error) {
      toast.error("Failed to read image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate slight delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300));

      const newMember = await store.addMember({
        ...formData,
        photoBase64: photoBase64,
        joinDate: new Date().toISOString(),
      });

      // Create a subscription for the member
      const plan = store.plans.find((p) => p.id === formData.planId);
      if (plan && newMember) {
        await store.renewSubscription(newMember.id, formData.planId, plan.duration);
      }

      toast.success("Member added successfully!");
      router.push(`/members/${newMember.id}`);
    } catch (error) {
      toast.error("Failed to add member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link
        href="/members"
        className="flex items-center gap-2 text-primary hover:text-accent mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Members
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8">
        Add New Member
      </h1>

      <Card className="p-8 bg-card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Profile Photo
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
            >
              {photoPreview ? (
                <div className="space-y-4">
                  <img
                    src={photoPreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-20 h-20 rounded-full mx-auto object-cover"
                  />
                  <p className="text-sm text-muted-foreground">
                    Click to change photo
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Drag and drop image here or click to browse
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Name *
              </label>
              <Input
                placeholder="John"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Name
              </label>
              <Input
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Contact Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+1-234-567-8900"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          {/* Gender & Plan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gender: e.target.value as "male" | "female" | "other",
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Subscription Plan *
              </label>
              <select
                value={formData.planId}
                onChange={(e) =>
                  setFormData({ ...formData, planId: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground"
              >
                {store.plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.price}/month
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              placeholder="Add any notes about the member..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6 border-t border-border">
            <Link href="/members" className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={loading || !formData.firstName}
              className="flex-1 bg-primary text-primary-foreground hover:bg-accent"
            >
              {loading ? "Saving..." : "Save Member"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
