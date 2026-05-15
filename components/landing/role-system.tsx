"use client"

import { cn } from "@/lib/utils"
import { SectionHeading } from "./section-heading"
import { Crown, ClipboardList, Monitor, Dumbbell, User } from "lucide-react"

const roles = [
  {
    icon: Crown,
    title: "Owner",
    description: "Full control. Revenue reports, staff management, settings, and billing — all in one view.",
  },
  {
    icon: ClipboardList,
    title: "Manager",
    description: "Day-to-day operations. Add members, process payments, and manage subscriptions.",
  },
  {
    icon: Monitor,
    title: "Receptionist",
    description: "Front desk focus. Scan QR codes, sell products, and check member status instantly.",
  },
  {
    icon: Dumbbell,
    title: "Trainer",
    description: "Build workout plans, manage bookings, and track client progress over time.",
  },
  {
    icon: User,
    title: "Member",
    description: "Personal portal. View your plan, log workouts, and check attendance history.",
  },
]

import Image from "next/image"

import { useState } from "react"
import { X } from "lucide-react"

export function RoleSystem() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  return (
    <section className="py-32 px-6 border-t border-white/[0.06]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-xl mb-16">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary mb-4">Built for every role</div>
          <SectionHeading
            title="One platform. Five different"
            highlight="experiences"
            align="left"
            className="mb-4"
          />
          <p className="text-[15px] text-white/80 leading-relaxed">
            Tailored dashboards for every role. From business analytics for owners to workout logging for members, everyone gets the tools they actually need.
          </p>
        </div>

        {/* Role Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {roles.map((r, i) => {
            // Bento spans
            const spans = [
              "md:col-span-8 md:row-span-2", // Owner
              "md:col-span-4",               // Manager
              "md:col-span-4",               // Receptionist
              "md:col-span-6",               // Trainer
              "md:col-span-6",               // Member
            ][i]

            const hasImage = i === 0 || i === 3 || i === 4
            const imagePath = i === 0 
              ? "/assets/dashboard/owner-dashboard.png" 
              : i === 3 
                ? "/assets/dashboard/trainer-dashboard.png" 
                : i === 4 
                  ? "/assets/dashboard/member-dashbaord.png" 
                  : ""

            return (
              <div key={i} className={cn("premium-stat-outer group", spans)}>
                <div className="stat-dot" />
                <div className="premium-stat-card p-0 overflow-hidden h-full flex flex-col bg-slate-950/40 backdrop-blur-md">
                  <div className="stat-ray" />
                  <div className="stat-line stat-topl" />
                  <div className="stat-line stat-leftl" />
                  <div className="stat-line stat-bottoml" />
                  <div className="stat-line stat-rightl" />
                  
                  <div className="relative z-20 h-full flex flex-col p-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <r.icon className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className={cn(
                        "font-bold text-white tracking-tight",
                        i === 0 ? "text-3xl" : "text-xl"
                      )}>
                        {r.title}
                      </h3>
                    </div>

                    <div className={cn(
                      "flex h-full gap-4",
                      i === 0 ? "flex-col lg:flex-row" : "flex-col sm:flex-row"
                    )}>
                      {/* Description */}
                      <div className={cn(
                        "flex flex-col",
                        i === 0 ? "lg:w-[22%] mb-4 lg:mb-0" : (hasImage ? "sm:w-[35%] mb-2 sm:mb-0" : "w-full")
                      )}>
                        <p className={cn(
                          "text-white/80 leading-relaxed",
                          i === 0 ? "text-[16px]" : "text-[13px]"
                        )}>
                          {i === 0 ? (
                            <>
                              Full control. <span className="bg-primary/20 text-primary px-1 rounded">Revenue reports</span>, staff management, settings, and billing.
                            </>
                          ) : r.description}
                        </p>
                      </div>

                      {/* Mockup */}
                      {hasImage && (
                        <div 
                          onClick={() => setSelectedImage(imagePath)}
                          className={cn(
                            "relative mt-auto sm:mt-0 overflow-hidden rounded-lg p-1 border border-white/10 bg-slate-900/50 shadow-2xl cursor-pointer group/mockup",
                            i === 0 
                              ? "lg:flex-1 aspect-video lg:translate-x-12 lg:translate-y-10 group-hover:translate-x-8 group-hover:translate-y-6 transition-transform duration-500" 
                              : "flex-1 aspect-video sm:translate-x-10 sm:translate-y-8 group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-500"
                          )}
                        >
                          <Image 
                            src={imagePath}
                            alt={`${r.title} Dashboard`}
                            fill
                            className="object-cover opacity-90 transition-opacity group-hover/mockup:opacity-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/40 to-transparent" />
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/mockup:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-primary text-black px-4 py-2 rounded-full text-xs font-bold shadow-xl translate-y-2 group-hover/mockup:translate-y-0 transition-transform">
                              View Dashboard
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300"
          style={{ background: 'rgba(0,0,0,0.9)' }}
        >
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => setSelectedImage(null)} 
          />
          
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[110]"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative w-full max-w-7xl aspect-video  overflow-hidden">
            <Image 
              src={selectedImage}
              alt="Dashboard Preview"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      )}
    </section>
  )
}

