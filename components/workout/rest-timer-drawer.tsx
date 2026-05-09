"use client";

import { useState, useEffect, useRef } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Timer, Check, SkipForward, Play, Pause, Dumbbell, Zap, Eye, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "ready" | "performing" | "resting";

interface RestTimerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercise: any;
  onComplete: () => void;
}

export function RestTimerDrawer({ open, onOpenChange, exercise, onComplete }: RestTimerDrawerProps) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [currentSet, setCurrentSet] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [restElapsed, setRestElapsed] = useState(0);

  // Per-set timing for anti-cheat
  const setStartTimeRef = useRef<Date | null>(null);
  const completedSetsRef = useRef<any[]>([]);

  // Track the last exercise ID so we only reset for a genuinely NEW exercise
  const lastExerciseIdRef = useRef<string | null>(null);

  const totalSets = exercise?.sets || 3;
  const restDuration = exercise?.restSeconds || 60;
  const mediaUrl = exercise?.exerciseId?.videoUrl || exercise?.exerciseId?.svgUrl || "";
  const isVideo = !!exercise?.exerciseId?.videoUrl;
  const SKIP_LOCK_SECONDS = 10;

  // Only reset state when a DIFFERENT exercise is opened — not on close/reopen
  useEffect(() => {
    if (!open || !exercise) return;
    const exId = exercise?.exerciseId?._id || exercise?.exerciseId?.id || null;
    if (exId !== lastExerciseIdRef.current) {
      lastExerciseIdRef.current = exId;
      setPhase("ready");
      setCurrentSet(1);
      setTimeLeft(exercise.restSeconds || 60);
      setTimerActive(false);
      setShowPreview(false);
      setRestElapsed(0);
      setStartTimeRef.current = null;
      completedSetsRef.current = [];
    }
  }, [open, exercise]);

  // Pause the timer automatically when the drawer is closed mid-rest
  useEffect(() => {
    if (!open && phase === "resting") {
      setTimerActive(false);
    }
  }, [open, phase]);

  // Countdown interval for the resting phase
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "resting" && timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setRestElapsed((prev) => prev + 1);
      }, 1000);
    } else if (phase === "resting" && timerActive && timeLeft === 0) {
      // Rest finished — move to next set
      setTimerActive(false);
      setRestElapsed(0);
      if (currentSet < totalSets) {
        setCurrentSet((prev) => prev + 1);
        setTimeLeft(restDuration);
        setPhase("performing");
        setStartTimeRef.current = new Date();
      } else {
        finishExercise();
      }
    }
    return () => clearInterval(interval);
  }, [phase, timerActive, timeLeft, currentSet, totalSets, restDuration, onComplete, onOpenChange]);

  const handleStart = () => {
    setPhase("performing");
    setShowPreview(false);
    setStartTimeRef.current = new Date();
    persistCompletion("in_progress");
  };

  const handleSetDone = () => {
    // Record set timing
    const now = new Date();
    const startedAt = setStartTimeRef.current || now;
    const durationSeconds = Math.round((now.getTime() - startedAt.getTime()) / 1000);
    completedSetsRef.current.push({
      setNumber: currentSet,
      startedAt: startedAt.toISOString(),
      completedAt: now.toISOString(),
      durationSeconds,
      reps: exercise?.reps,
    });

    if (currentSet < totalSets) {
      setPhase("resting");
      setTimerActive(true);
      setTimeLeft(restDuration);
      setRestElapsed(0);
      setShowPreview(false);
      persistCompletion("in_progress");
    } else {
      finishExercise();
    }
  };

  const handleSkipRest = () => {
    setTimerActive(false);
    setRestElapsed(0);
    if (currentSet < totalSets) {
      setCurrentSet((prev) => prev + 1);
      setTimeLeft(restDuration);
      setPhase("performing");
      setStartTimeRef.current = new Date();
    } else {
      finishExercise();
    }
  };

  const finishExercise = () => {
    persistCompletion("completed");
    lastExerciseIdRef.current = null;
    onComplete();
    onOpenChange(false);
  };

  const persistCompletion = async (status: "in_progress" | "completed") => {
    try {
      const exId = exercise?.exerciseId?._id || exercise?.exerciseId?.id;
      if (!exId) return;
      const token = localStorage.getItem("memberToken");
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch("/api/exercise-completion", {
        method: "POST",
        headers,
        body: JSON.stringify({
          exerciseId: exId,
          planId: exercise?.planId || "",
          sets: completedSetsRef.current,
          totalSets,
          status,
        }),
      });
    } catch (err) {
      console.error("Failed to persist completion:", err);
    }
  };

  const progress = restDuration > 0 ? (timeLeft / restDuration) * 100 : 0;
  const canSkipRest = restElapsed >= SKIP_LOCK_SECONDS;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!max-w-md mx-auto glass-premium bg-card border-white/10 backdrop-blur-2xl">

        {/* Header */}
        <DrawerHeader className="border-b border-white/5 pb-4 mt-2">
          <DrawerTitle className="flex items-center justify-between px-2">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">
                  {phase === "ready" ? "Exercise Preview" : "Live Exercise"}
                </span>
              </div>
              <span className="text-xl font-black uppercase tracking-tighter text-white truncate max-w-[200px]">
                {exercise?.exerciseId?.name || "Exercise"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Current Goal</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[10px] font-black text-primary">
                  {totalSets} SETS
                </span>
                <span className="text-[10px] font-bold text-slate-400">×</span>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-black text-white">
                  {exercise?.reps} REPS
                </span>
              </div>
            </div>
          </DrawerTitle>
        </DrawerHeader>

        {/* Body — three phases */}
        <div className="py-8 flex flex-col items-center justify-center space-y-8 min-h-[340px]">
          <AnimatePresence mode="wait">

            {/* ─── PHASE 1: READY — show media preview ─── */}
            {phase === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center w-full px-6 space-y-6"
              >
                {/* Media box */}
                {mediaUrl ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/30 shadow-2xl">
                    {isVideo ? (
                      <video
                        src={mediaUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/2">
                        <img
                          src={mediaUrl}
                          alt={exercise?.exerciseId?.name}
                          className="max-w-[70%] max-h-[70%] object-contain drop-shadow-2xl"
                        />
                      </div>
                    )}
                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/30 flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                      <span className="text-[7px] font-black text-primary uppercase tracking-wider">
                        {isVideo ? "Video Demo" : "Illustration"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center border border-dashed border-white/10 bg-white/2">
                    <Dumbbell className="w-10 h-10 text-slate-800 mb-3" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Demo Available</p>
                  </div>
                )}

                {/* Exercise description hint */}
                {exercise?.exerciseId?.description && (
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed text-center px-4 line-clamp-3">
                    {exercise.exerciseId.description}
                  </p>
                )}

                {/* Rest duration info */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                    <Timer className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {restDuration}s rest between sets
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PHASE 2: PERFORMING — set counter OR preview ─── */}
            {phase === "performing" && (
              <motion.div
                key={showPreview ? "preview" : "performing"}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col items-center space-y-8 w-full px-6"
              >
                {showPreview ? (
                  /* ── Inline Preview ── */
                  <>
                    {mediaUrl ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/30 shadow-2xl">
                        {isVideo ? (
                          <video
                            src={mediaUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/2">
                            <img
                              src={mediaUrl}
                              alt={exercise?.exerciseId?.name}
                              className="max-w-[70%] max-h-[70%] object-contain drop-shadow-2xl"
                            />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-primary/30 flex items-center gap-1.5">
                          <Eye className="w-2.5 h-2.5 text-primary" />
                          <span className="text-[7px] font-black text-primary uppercase tracking-wider">
                            Preview — Set {currentSet}/{totalSets}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-2xl flex flex-col items-center justify-center border border-dashed border-white/10 bg-white/2">
                        <Dumbbell className="w-10 h-10 text-slate-800 mb-3" />
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No Demo Available</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* ── Set Counter ── */
                  <>
                    <div className="relative w-64 h-64 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                        <circle
                          cx="128" cy="128" r="115"
                          stroke="currentColor" strokeWidth="5" fill="transparent"
                          strokeDasharray="722.6"
                          strokeDashoffset={722.6 - (722.6 * ((currentSet - 1) / totalSets))}
                          className="text-primary/30"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <motion.div
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                          className="flex flex-col items-center"
                        >
                          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Perform Set</div>
                          <span className="text-8xl font-black text-white tracking-tighter leading-none">
                            {currentSet}<span className="text-3xl text-slate-700">/{totalSets}</span>
                          </span>
                          <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">
                            {exercise?.reps} reps
                          </p>
                        </motion.div>
                      </div>
                    </div>

                    {/* Set progress dots */}
                    <div className="flex items-center gap-3">
                      {Array.from({ length: totalSets }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-12 h-2 rounded-full transition-all duration-500",
                            i + 1 < currentSet
                              ? "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
                              : i + 1 === currentSet
                                ? "bg-white/20"
                                : "bg-white/5"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ─── PHASE 3: RESTING — countdown ring ─── */}
            {phase === "resting" && (
              <motion.div
                key="resting"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="flex flex-col items-center space-y-8"
              >
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* SVG Progress Ring */}
                  <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)]">
                    <circle cx="128" cy="128" r="115" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                    <motion.circle
                      cx="128" cy="128" r="115"
                      stroke="currentColor" strokeWidth="6" fill="transparent"
                      strokeDasharray="722.6"
                      animate={{ strokeDashoffset: 722.6 - (722.6 * progress) / 100 }}
                      transition={{ duration: 1, ease: "linear" }}
                      className="text-primary"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Center countdown */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-7xl font-black text-white font-mono tabular-nums tracking-tighter">
                      {timeLeft}<span className="text-2xl text-primary ml-1">s</span>
                    </span>
                    <div className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <Timer className="w-3 h-3 text-primary animate-pulse" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Resting</span>
                    </div>
                  </div>
                </div>

                {/* Set progress dots */}
                <div className="flex items-center gap-3">
                  {Array.from({ length: totalSets }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-12 h-2 rounded-full transition-all duration-700 relative overflow-hidden",
                        i + 1 < currentSet
                          ? "bg-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.4)]"
                          : i + 1 === currentSet
                            ? "bg-white/10"
                            : "bg-white/5"
                      )}
                    >
                      {i + 1 === currentSet && (
                        <motion.div
                          className="absolute inset-0 bg-primary"
                          initial={{ x: "-100%" }}
                          animate={{ x: "0%" }}
                          transition={{ duration: restDuration, ease: "linear" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer — contextual buttons */}
        <DrawerFooter className="flex-row gap-3 p-6 border-t border-white/5 bg-white/2 backdrop-blur-md">
          {phase === "ready" && (
            <Button
              className="flex-1 h-16 rounded-3xl bg-primary text-black hover:bg-white font-black tracking-tighter shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] active:scale-95 transition-all text-base group"
              onClick={handleStart}
            >
              <Play className="w-6 h-6 mr-3 fill-current group-hover:scale-110 transition-transform" />
              Start Exercise
            </Button>
          )}

          {phase === "performing" && (
            <>
              {showPreview ? (
                <Button
                  className="flex-1 h-16 rounded-3xl bg-primary text-black hover:bg-white font-black tracking-tighter shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] active:scale-95 transition-all text-base group"
                  onClick={() => setShowPreview(false)}
                >
                  <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                  Back to Set {currentSet}
                </Button>
              ) : (
                <>
                  {mediaUrl && (
                    <Button
                      variant="outline"
                      className="h-16 w-16 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 transition-all shrink-0"
                      onClick={() => setShowPreview(true)}
                    >
                      <Eye className="w-5 h-5 text-slate-400" />
                    </Button>
                  )}
                  <Button
                    className="flex-1 h-16 rounded-3xl bg-primary text-black hover:bg-white font-black tracking-tighter shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] active:scale-95 transition-all text-base group"
                    onClick={handleSetDone}
                  >
                    <Check className="w-6 h-6 mr-3 stroke-[4px] group-hover:scale-110 transition-transform" />
                    {currentSet === totalSets ? "Complete Exercise" : `Done with Set ${currentSet}`}
                  </Button>
                </>
              )}
            </>
          )}

          {phase === "resting" && (
            <>
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                onClick={() => setTimerActive(!timerActive)}
              >
                {timerActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {timerActive ? "Pause" : "Resume"}
              </Button>
              <Button
                className={cn(
                  "flex-1 h-14 rounded-2xl font-black tracking-tighter transition-all",
                  canSkipRest
                    ? "bg-slate-100 text-black hover:bg-white"
                    : "bg-white/5 text-slate-600 cursor-not-allowed"
                )}
                onClick={handleSkipRest}
                disabled={!canSkipRest}
              >
                <SkipForward className="w-4 h-4 mr-2" />
                {canSkipRest ? "Skip Rest" : `Wait ${SKIP_LOCK_SECONDS - restElapsed}s`}
              </Button>
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
