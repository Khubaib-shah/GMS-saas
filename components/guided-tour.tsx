"use client"

import { TourProvider, useTour } from "@reactour/tour"
import { useEffect, useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { HelpCircle, X, ChevronLeft, ChevronRight, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"

const TOUR_STORAGE_KEY = "gymflow-tour-completed"

// Tour steps for the dashboard
const dashboardSteps = [
    {
        selector: '[data-tour="sidebar-logo"]',
        content: () => (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    <h3 className="font-black text-lg italic tracking-tight">Welcome to GymFlow!</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    This is your <strong>command center</strong> for managing everything about your gym. Let's take a quick tour to get you started!
                </p>
            </div>
        ),
    },
    {
        selector: '[data-tour="sidebar-nav"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">Navigation Hub</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Access all your gym management modules from here — <strong>Members, Attendance, Subscriptions, Payments, Trainers</strong>, and more. Each section is built for speed and precision.
                </p>
            </div>
        ),
    },
    {
        selector: '[data-tour="navbar-search"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">Quick Search</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Need to find a member fast? Use the <strong>search bar</strong> to instantly filter through your records across the system.
                </p>
            </div>
        ),
    },

    {
        selector: '[data-tour="navbar-notifications"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">Live Alerts</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Stay on top of your gym with <strong>real-time notifications</strong> — expiring subscriptions, new members, and recent payments all appear here.
                </p>
            </div>
        ),
    },
    {
        selector: '[data-tour="navbar-profile"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">Your Profile</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Your identity and role are displayed here. You can manage your account from <strong>Settings</strong> in the sidebar.
                </p>
            </div>
        ),
    },
    {
        selector: '[data-tour="dashboard-stats"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">Key Metrics</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Your <strong>most important KPIs</strong> at a glance — total members, active subscriptions, expiring plans, and monthly revenue.
                </p>
            </div>
        ),
    },
    {
        selector: '[data-tour="dashboard-charts"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">Analytics & Trends</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Visual breakdowns of your <strong>revenue trends</strong> and <strong>subscription distribution</strong>. Track growth over time and make data-driven decisions.
                </p>
            </div>
        ),
    },
    {
        selector: '[data-tour="dashboard-members"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">Recent Members</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Quick view of your <strong>latest member registrations</strong>. Click on any member to view their full profile, subscription, and payment history.
                </p>
            </div>
        ),
    },
    {
        selector: '[data-tour="sidebar-logout"]',
        content: () => (
            <div className="space-y-3">
                <h3 className="font-black text-lg italic tracking-tight">You're All Set! 🎉</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    That's the basics! Start by <strong>adding members</strong>, creating <strong>plans</strong>, and managing <strong>subscriptions</strong>. You can replay this tour anytime from the help button.
                </p>
            </div>
        ),
    },
]

// Floating trigger button
function TourTrigger() {
    const { setIsOpen } = useTour()

    return (
        <Button
            data-tour="help-trigger"
            onClick={() => setIsOpen(true)}
            variant="ghost"
            size="icon"
            className="fixed bottom-6 right-6 z-[9999] h-[38px] w-14 rounded-full bg-primary text-primary-foreground shadow-2xl hover:bg-primary/90 neon-glow transition-all hover:scale-110 group"
            title="Start guided tour"
        >
            <HelpCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        </Button>
    )
}

// Auto-start tour on first visit
function TourAutoStart() {
    const { setIsOpen, setCurrentStep } = useTour()
    const pathname = usePathname()
    const { data: session, status } = useSession()
    const [hasChecked, setHasChecked] = useState(false)

    useEffect(() => {
        if (status !== "authenticated" || hasChecked) return
        if (pathname !== "/dashboard") return

        // Check if tour has been completed before
        const tourCompleted = localStorage.getItem(TOUR_STORAGE_KEY)
        if (!tourCompleted) {
            // Small delay to let DOM elements render
            const timer = setTimeout(() => {
                setCurrentStep(0)
                setIsOpen(true)
            }, 1500)
            return () => clearTimeout(timer)
        }
        setHasChecked(true)
    }, [status, pathname, hasChecked, setIsOpen, setCurrentStep])

    return null
}

// Custom tour UI components
function TourContent({ steps, currentStep, setCurrentStep, setIsOpen }: any) {
    const isLastStep = currentStep === steps.length - 1
    const isFirstStep = currentStep === 0
    const StepContent = steps[currentStep]?.content

    const handleClose = useCallback(() => {
        setIsOpen(false)
        localStorage.setItem(TOUR_STORAGE_KEY, "true")
    }, [setIsOpen])

    return (
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm relative backdrop-blur-xl">
            {/* Close button */}
            <button
                onClick={handleClose}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Step content */}
            <div className="mb-6">
                {StepContent && <StepContent />}
            </div>

            {/* Progress bar */}
            <div className="flex gap-1 mb-4">
                {steps.map((_: any, i: number) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${i <= currentStep ? "bg-primary" : "bg-muted"
                            }`}
                    />
                ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    {currentStep + 1} / {steps.length}
                </div>
                <div className="flex gap-2">
                    {!isFirstStep && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="h-9 px-4 rounded-xl text-xs font-bold"
                        >
                            <ChevronLeft className="w-3 h-3 mr-1" />
                            Back
                        </Button>
                    )}
                    {isFirstStep && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClose}
                            className="h-9 px-4 rounded-xl text-xs font-bold text-muted-foreground"
                        >
                            Skip tour
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={() => {
                            if (isLastStep) {
                                handleClose()
                            } else {
                                setCurrentStep(currentStep + 1)
                            }
                        }}
                        className="h-9 px-4 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        {isLastStep ? "Finish" : "Next"}
                        {!isLastStep && <ChevronRight className="w-3 h-3 ml-1" />}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export function GuidedTourProvider({ children }: { children: React.ReactNode }) {
    return (
        <TourProvider
            steps={dashboardSteps}
            ContentComponent={TourContent}
            styles={{
                popover: (base) => ({
                    ...base,
                    background: "transparent",
                    padding: 0,
                    borderRadius: "16px",
                    boxShadow: "none",
                }),
                maskArea: (base) => ({
                    ...base,
                    rx: 12,
                }),
                maskWrapper: (base) => ({
                    ...base,
                    opacity: 0.7,
                }),
                highlightedArea: (base) => ({
                    ...base,
                    display: "block",
                    stroke: "hsl(var(--primary))",
                    strokeWidth: 2,
                    rx: 12,
                }),
            }}
            padding={{ mask: 8, popover: [16, 12] }}
            onClickMask={() => { }}
            scrollSmooth
            afterOpen={() => document.body.style.overflow = "hidden"}
            beforeClose={() => document.body.style.overflow = "auto"}
        >
            {children}
            <TourTrigger />
            <TourAutoStart />
        </TourProvider>
    )
}
