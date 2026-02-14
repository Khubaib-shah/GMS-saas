"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, User, Mail, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Our Trainers</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meet Our Trainers</h1>
          <p className="text-muted-foreground mt-2">
            Expert guidance to help you reach your fitness goals.
          </p>
        </div>
      </div>

      {trainers.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No trainers found</h3>
          <p className="text-muted-foreground">
            Add staff with the "Trainer" role in Settings to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <Card key={trainer._id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 relative">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-sm">
                        <AvatarImage src={trainer.photo} alt={trainer.fullName} />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                        {trainer.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <CardTitle className="text-xl">{trainer.fullName}</CardTitle>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-1">
                    <Mail className="w-3 h-3" />
                    {trainer.email}
                </div>
              </CardHeader>
              <CardContent className="flex-1 text-center space-y-4">
                {trainer.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {trainer.bio}
                    </p>
                )}
                
                <div className="flex flex-wrap gap-2 justify-center">
                    {trainer.specialties?.slice(0, 3).map((spec, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                            {spec}
                        </Badge>
                    ))}
                    {trainer.specialties && trainer.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{trainer.specialties.length - 3}</Badge>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-lg">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{trainer.memberCount || 0}</span>
                    <span className="text-xs text-muted-foreground">Active Clients</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6 flex justify-center">
                <Button asChild className="w-full" variant="outline">
                    <Link href={`/trainers/${trainer._id}`}>
                        View Profile <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
