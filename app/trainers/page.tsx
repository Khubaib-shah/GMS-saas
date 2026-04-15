"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, User, Mail, Award, ArrowRight, ShieldAlert } from "lucide-react";
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
    <div className="space-y-10 animate-fade-up">
      <DashboardHeader
        title="OUR"
        highlight="TRAINERS"
        subtitle="Trainer Directory"
        description="Meet our team of professional fitness experts."
        descriptionIconColor="emerald"
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
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
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] italic leading-relaxed">
            No trainers found<br />
            <span className="text-[8px] tracking-widest mt-2 block opacity-60">Add staff with the "Trainer" role in Settings</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trainers.map((trainer) => (
            <div key={trainer._id} className="glass-premium p-8 border-border dark:bg-slate-950/40 hover:scale-[1.02] transition-all group flex flex-col items-center text-center">
              <div className="relative mb-6">
                <Avatar className="w-24 h-24 rounded-2xl border-4 border-background shadow-2xl transition-transform group-hover:scale-110 duration-500">
                  <AvatarImage src={trainer.photo} alt={trainer.fullName} className="object-cover" />
                  <AvatarFallback className="text-2xl font-black italic bg-primary/10 text-primary">
                    {trainer.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-primary text-black p-1.5 rounded-lg shadow-lg">
                  <Award className="w-4 h-4" />
                </div>
              </div>

              <h3 className="text-xl font-black italic tracking-tighter text-foreground uppercase mb-1">
                {trainer.fullName}
              </h3>
              
              <div className="flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-500 uppercase italic mb-6">
                <Mail className="w-3 h-3 text-primary/50" />
                {trainer.email}
              </div>

              {trainer.bio && (
                <p className="text-xs text-slate-400 font-medium leading-relaxed italic line-clamp-3 mb-8 px-2">
                  "{trainer.bio}"
                </p>
              )}

              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {trainer.specialties?.slice(0, 3).map((spec, i) => (
                  <Badge key={i} className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black italic tracking-widest uppercase px-3 py-1">
                    {spec}
                  </Badge>
                ))}
                {trainer.specialties && trainer.specialties.length > 3 && (
                  <Badge className="bg-white/5 text-slate-500 border-white/10 text-[9px] font-black italic tracking-widest uppercase px-3 py-1">
                    +{trainer.specialties.length - 3}
                  </Badge>
                )}
              </div>

              {/* Stats Box */}
              <div className="w-full grid grid-cols-2 gap-4 mt-auto">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                  <Users className="w-4 h-4 text-primary mb-1" />
                  <span className="font-black italic tracking-tighter text-lg">{trainer.memberCount || 0}</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Clients</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                  <ShieldAlert className="w-4 h-4 text-slate-500 mb-1" />
                  <span className="font-black italic tracking-tighter text-lg">PRO</span>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Level</span>
                </div>
              </div>

              <div className="w-full mt-8">
                <Link href={`/trainers/${trainer._id}`} className="block">
                  <Button className="w-full h-12 rounded-xl bg-white/5 border-white/10 text-white font-black italic text-[10px] tracking-widest uppercase hover:bg-primary hover:text-black transition-all group-hover:neon-glow">
                    View Profile <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
