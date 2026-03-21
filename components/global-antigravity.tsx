"use client";

import dynamic from "next/dynamic";

const Antigravity = dynamic(() => import("./landing/antigravity"), { ssr: false });

export function GlobalAntigravity() {
  return (
    <div className="fixed inset-0 w-full h-full z-[-1] pointer-events-none opacity-80">
      <Antigravity
        count={300}
        magnetRadius={6}
        ringRadius={7}
        waveSpeed={0.4}
        waveAmplitude={1}
        particleSize={1.5}
        lerpSpeed={0.05}
        color="#5227FF"
        autoAnimate
        particleVariance={1}
        rotationSpeed={0}
        depthFactor={1}
        pulseSpeed={3}
        particleShape="capsule"
        fieldStrength={10}
      />
    </div>
  );
}
