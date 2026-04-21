import { Suspense } from "react";
import WorkoutPlansClient from "./WorkoutPlansClient";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workout Plans | GMS SaaS',
  description: 'Manage workout plans and templates for your gym members.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="text-primary font-black italic animate-pulse tracking-widest uppercase text-xs">Loading Workout Plans...</div>}>
      <WorkoutPlansClient />
    </Suspense>
  );
}
