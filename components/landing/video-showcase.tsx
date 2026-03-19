"use client"

import { Play } from "lucide-react"
import { useState } from "react"

export function VideoShowcase() {
    const [isPlaying, setIsPlaying] = useState(false);
    return (
        <section className="py-24 px-6 bg-slate-950 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6 tracking-widest uppercase">
                        Product Walkthrough
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">
                        See GymFlow in Action.
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Watch how easy it is to manage your entire fitness business, automate payments, and track attendance from one centralized dashboard.
                    </p>
                </div>

                {/* Video Container */}
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-[0_0_50px_rgba(190,255,0,0.1)] group hover:shadow-[0_0_80px_rgba(190,255,0,0.2)] transition-shadow duration-700">

                    {!isPlaying ? (
                        <>
                            {/* Thumbnail / Placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/35 to-slate-800/35">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
                                {/* We keep the iframe but without autoplay and pointer events so it acts as a thumbnail */}
                                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/yo6-_FYRHhc?si=LlNHlBRrACcmxo5P&controls=0" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                                    className="w-full h-full object-cover opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000 ease-out pointer-events-none"
                                ></iframe>
                                <div className="absolute inset-0 bg-slate-950/5 group-hover:bg-transparent transition-colors duration-700"></div>
                            </div>

                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-auto z-10" onClick={() => setIsPlaying(true)}>
                                <div className="w-24 h-24 rounded-full bg-primary/90 text-black flex items-center justify-center pl-2 group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-[0_0_40px_rgba(190,255,0,0.3)] backdrop-blur-sm">
                                    <Play className="w-10 h-10 fill-black" />
                                </div>
                            </div>

                            {/* Bottom Gradient for depth */}
                            <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none"></div>
                        </>
                    ) : (
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/yo6-_FYRHhc?si=LlNHlBRrACcmxo5P&autoplay=1" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    )}
                </div>
            </div>
        </section>
    )
}
