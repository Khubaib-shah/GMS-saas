"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface Branch {
    _id: string;
    name: string;
    address?: string;
    phone?: string;
    isDefault?: boolean;
    isActive?: boolean;
}

interface BranchContextType {
    branches: Branch[];
    selectedBranchId: string | null;
    selectedBranch: Branch | null;
    selectBranch: (branchId: string | null) => void;
    isLoading: boolean;
    hasBranches: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch gym branches on mount
    useEffect(() => {
        async function fetchBranches() {
            if (status !== "authenticated") {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/gym/branches");
                if (res.ok) {
                    const data = await res.json();
                    setBranches(data.branches || []);
                    
                    // Set default branch if user is branch-scoped
                    const user = session?.user as any;
                    if (user?.branchId) {
                        setSelectedBranchId(user.branchId);
                    } else if (data.branches?.length > 0) {
                        // Select default branch or first one
                        const defaultBranch = data.branches.find((b: Branch) => b.isDefault);
                        if (defaultBranch) {
                            setSelectedBranchId(defaultBranch._id);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch branches:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchBranches();
    }, [session, status]);

    // Persist selection to localStorage
    useEffect(() => {
        if (selectedBranchId) {
            localStorage.setItem("selectedBranchId", selectedBranchId);
        } else {
            localStorage.removeItem("selectedBranchId");
        }
    }, [selectedBranchId]);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("selectedBranchId");
        if (stored && !selectedBranchId) {
            setSelectedBranchId(stored);
        }
    }, []);

    const selectedBranch = branches.find(b => b._id === selectedBranchId) || null;

    const selectBranch = (branchId: string | null) => {
        setSelectedBranchId(branchId);
    };

    return (
        <BranchContext.Provider
            value={{
                branches,
                selectedBranchId,
                selectedBranch,
                selectBranch,
                isLoading,
                hasBranches: branches.length > 0,
            }}
        >
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error("useBranch must be used within a BranchProvider");
    }
    return context;
}
