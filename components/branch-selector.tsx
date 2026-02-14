"use client";

import { useBranch } from "@/hooks/use-branch";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface BranchSelectorProps {
    className?: string;
    showAllOption?: boolean;
}

export function BranchSelector({ className, showAllOption = true }: BranchSelectorProps) {
    const { branches, selectedBranchId, selectBranch, hasBranches, isLoading } = useBranch();
    const { branchId: userBranchId } = usePermissions();

    // Don't show if no branches or user is branch-locked
    if (!hasBranches || userBranchId) {
        return null;
    }

    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Loading...</span>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Select
                value={selectedBranchId || "all"}
                onValueChange={(value) => selectBranch(value === "all" ? null : value)}
            >
                <SelectTrigger className="w-[180px] h-8">
                    <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                    {showAllOption && (
                        <SelectItem value="all">All Branches</SelectItem>
                    )}
                    {branches.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                            {branch.name}
                            {branch.isDefault && " (Main)"}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
