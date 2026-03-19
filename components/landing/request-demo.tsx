"use client"


import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

export const RequestDemo = () => {
    return (
        <section id='request-demo' className="flex-1 flex flex-col items-center justify-center py-20 px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">

                {/* Left Side: Value Proposition */}
                <div className="order-2 lg:order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-widest">
                        BOOK A FREE DEMO
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
                        See GymFlow <br /> in action.
                    </h1>
                    <p className="text-lg text-slate-400 mb-10 max-w-lg leading-relaxed">
                        Join the hundreds of modern gym owners who use GymFlow to automate their business. Get a personalized walkthrough of the platform.
                    </p>

                    <div className="space-y-6">
                        {[
                            "Personalized platform walkthrough",
                            "Data migration and onboarding plan",
                            "Custom pricing estimate based on your branch size",
                            "Q&A session with our fitness software experts"
                        ].map((benefit, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-slate-300 font-medium">{benefit}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="order-1 lg:order-2">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
                        <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"></div>

                        <h2 className="text-2xl font-semibold text-white mb-6">Tell us about your gym</h2>

                        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-slate-400">First Name</Label>
                                    <Input id="firstName" placeholder="John" className="bg-white/5 border-white/10 focus-visible:ring-primary h-12 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-slate-400">Last Name</Label>
                                    <Input id="lastName" placeholder="Doe" className="bg-white/5 border-white/10 focus-visible:ring-primary h-12 text-white" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-400">Work Email</Label>
                                <Input type="email" id="email" placeholder="john@elitefitness.com" className="bg-white/5 border-white/10 focus-visible:ring-primary h-12 text-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gymName" className="text-slate-400">Gym or Studio Name</Label>
                                <Input id="gymName" placeholder="Elite Fitness Studio" className="bg-white/5 border-white/10 focus-visible:ring-primary h-12 text-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="members" className="text-slate-400">Estimated Active Members</Label>
                                <select
                                    id="members"
                                    className="flex h-12 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">Select range...</option>
                                    <option value="1-100" className="bg-slate-900">1 - 100</option>
                                    <option value="101-500" className="bg-slate-900">101 - 500</option>
                                    <option value="501-1000" className="bg-slate-900">501 - 1,000</option>
                                    <option value="1000+" className="bg-slate-900">1,000+</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-slate-400">Anything specific you're looking for?</Label>
                                <Textarea
                                    id="message"
                                    placeholder="We're currently struggling with tracking manual payments..."
                                    className="bg-white/5 border-white/10 focus-visible:ring-primary min-h-[100px] text-white resize-none"
                                />
                            </div>

                            <Button className="w-full h-14 bg-primary text-black hover:bg-white transition-all text-base font-semibold group flex items-center justify-center gap-2 mt-4">
                                Request Demo
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Button>

                            <p className="text-center text-xs text-slate-500 pt-2">
                                By submitting this form, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}
