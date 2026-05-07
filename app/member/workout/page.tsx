"use client";

import { useState } from "react";
import {
    Dumbbell,
    History,
    Zap,
    ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActiveWorkout } from "@/modules/member/ActiveWorkout";
import { WorkoutHistory } from "@/modules/member/WorkoutHistory";
import { useRouter } from "next/navigation";

export default function MemberWorkoutPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-primary/30">
            {/* Background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse duration-[7000ms]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/40 backdrop-blur-xl">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="text-slate-500 hover:text-white hover:bg-white/5 rounded-xl"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                            <Dumbbell className="h-6 w-6 text-black" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter uppercase leading-none">
                                WORKOUT <span className="text-primary">CENTER</span>
                            </h1>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">ACTIVE WORKOUT</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-10 relative z-10">
                <Tabs defaultValue="active" className="space-y-10">
                    <div className="flex justify-center">
                        <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl h-[38px]">
                            <TabsTrigger
                                value="active"
                                className="px-8 font-black text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-primary data-[state=active]:text-black transition-all"
                            >
                                <Zap className="w-4 h-4 mr-3" />
                                LIVE SESSION
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="px-8 font-black text-[11px] uppercase tracking-widest rounded-xl data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all"
                            >
                                <History className="w-4 h-4 mr-3" />
                                LOG HISTORY
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="active" className="max-w-3xl mx-auto focus-visible:outline-none focus:outline-none">
                        <ActiveWorkout />
                    </TabsContent>

                    <TabsContent value="history" className="max-w-4xl mx-auto focus-visible:outline-none focus:outline-none">
                        <WorkoutHistory />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
