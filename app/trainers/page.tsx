"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, User, Mail, Award, ArrowRight, ShieldAlert, Filter, Search } from "lucide-react";
import { InputField } from "@/components/ui/input-field";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/components/dashboard-header";

interface Trainer {
  _id: string;
  fullName: string;
  email: string;
  bio?: string;
  specialties?: string[];
  photo?: string;
  memberCount?: number;
}

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const filteredTrainers = trainers.filter(t =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    t.specialties?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    async function fetchTrainers() {
      try {
        const res = await fetch("/api/trainers");
        if (res.ok) {
          const data = await res.json();
          setTrainers(data);
        }
      } catch (error) {
        console.error("Failed to fetch trainers", error);
      } finally {
        setLoading(false);
      }
    }
    fetchTrainers();
  }, []);



  return (
    <div className="space-y-4 md:space-y-10 animate-fade-up">
      <DashboardHeader
        title="Our"
        highlight="Trainers"
        subtitle="Trainer Directory"
        description="Meet our team of professional fitness experts."
      />

      {/* Search & Filter HUD */}
      <div className="flex flex-col md:flex-row items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-4 md:mb-10 backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 border-r border-white/10 hidden md:flex">
          <Filter className="w-3.5 h-3.5 text-primary/50" />
          <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
            Filter
          </span>
        </div>

        <div className="flex-1 w-full">
          <InputField
            hideLabel
            validateType="text"
            placeholder="Search trainers by name, email, or specialty..."
            value={search}
            onChange={(val) => setSearch(val)}
            leadingIcon={<Search className="w-4 h-4" />}
            className="h-10 bg-transparent border-none hover:bg-white/5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all focus:border-none focus:ring-0"
            containerClassName="w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-premium p-8 border-border dark:bg-slate-950/40 animate-pulse flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-white/5 mb-6" />
              <div className="h-6 w-40 bg-white/5 rounded-lg mb-2" />
              <div className="h-3 w-32 bg-white/5 rounded mb-8" />
              <div className="h-4 w-full bg-white/5 rounded mb-2" />
              <div className="h-4 w-3/4 bg-white/5 rounded mb-8" />
              <div className="flex gap-2 mb-8">
                <div className="h-6 w-16 bg-white/5 rounded-lg" />
                <div className="h-6 w-16 bg-white/5 rounded-lg" />
              </div>
              <div className="w-full grid grid-cols-2 gap-4 mt-auto">
                <div className="h-16 bg-white/5 rounded-xl border border-white/5" />
                <div className="h-16 bg-white/5 rounded-xl border border-white/5" />
              </div>
              <div className="w-full mt-8 h-12 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      ) : trainers.length === 0 ? (
        <div className="text-center py-24 glass-premium border-dashed opacity-50">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-slate-700" />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] leading-relaxed">
            No trainers found<br />
            <span className="text-[8px] tracking-widest mt-2 block opacity-60">Add staff with the "Trainer" role in Settings</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {filteredTrainers.map((trainer) => (
            <div key={trainer._id} className="glass-premium p-6 md:p-8 border-border dark:bg-slate-950/40 transition-all flex flex-col items-center text-center group/card">
              <div className="relative mb-4 md:mb-6">
                <Avatar className="w-20 h-20 md:w-24 md:h-24 transition-transform group-hover/card:scale-105">
                  <AvatarImage src={trainer.photo} alt={trainer.fullName} className="object-cover" />
                  <AvatarFallback className="text-xl md:text-2xl font-black bg-primary/10 text-primary">
                    {trainer.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-primary text-black p-1.5 rounded-lg shadow-lg">
                  <Award className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              </div>

              <h3 className="text-lg md:text-xl font-medium md:font-black tracking-tighter text-foreground uppercase mb-1">
                {trainer.fullName}
              </h3>

              <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-black tracking-widest text-slate-500 uppercase mb-4 md:mb-6">
                <Mail className="w-3 h-3 text-primary/50" />
                <span className="truncate max-w-[150px] md:max-w-none">{trainer.email}</span>
              </div>

              {trainer.bio && (
                <p className="text-[11px] md:text-xs text-slate-400 font-medium leading-relaxed line-clamp-2 md:line-clamp-3 mb-6 md:mb-8 px-2">
                  "{trainer.bio}"
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center mb-6 md:mb-8">
                {trainer.specialties?.slice(0, 3).map((spec, i) => (
                  <Badge key={i} className="bg-primary/5 text-primary border-primary/20 text-[8px] md:text-[9px] font-black tracking-widest uppercase px-2 md:px-3 py-0.5 md:py-1">
                    {spec}
                  </Badge>
                ))}
                {trainer.specialties && trainer.specialties.length > 3 && (
                  <Badge className="bg-white/5 text-slate-500 border-white/10 text-[8px] md:text-[9px] font-black tracking-widest uppercase px-2 md:px-3 py-0.5 md:py-1">
                    +{trainer.specialties.length - 3}
                  </Badge>
                )}
              </div>

              {/* Stats Box */}
              <div className="w-full grid grid-cols-2 gap-3 md:gap-4 mt-auto">
                <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                  <Users className="w-3.5 h-3.5 text-primary mb-1" />
                  <span className="font-medium md:font-black tracking-tighter text-base md:text-lg">{trainer.memberCount || 0}</span>
                  <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Clients</span>
                </div>
                <div className="p-3 md:p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-500 mb-1" />
                  <span className="font-medium md:font-black tracking-tighter text-base md:text-lg">PRO</span>
                  <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest">Level</span>
                </div>
              </div>

              <div className="w-full mt-6 md:mt-8">
                <Link href={`/trainers/${trainer._id}`} className="block">
                  <button className="group relative w-full h-11 md:h-12 bg-white/5 border border-white/10 text-white font-medium md:font-black text-[9px] md:text-[10px] tracking-widest uppercase rounded-xl overflow-hidden transition-all">
                    {/* Expanding background icon container */}
                    <div className="absolute right-1.5 top-1.5 h-8 w-8 md:h-9 md:w-9 bg-primary rounded-lg flex items-center justify-center transition-all duration-300 group-hover:w-[calc(100%-12px)] shadow-[0_0_20px_rgba(var(--primary),0.3)] z-10">
                      <ArrowRight className="w-4 h-4 text-black transition-transform duration-300 group-hover:translate-x-1" />
                    </div>

                    {/* Button Text */}
                    <span className="relative z-20 pl-4 md:pl-6 pr-10 md:pr-12 flex items-center h-full transition-colors duration-300 group-hover:text-black">
                      View Profile
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
