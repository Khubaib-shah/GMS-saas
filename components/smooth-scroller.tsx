"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroller() {
    useEffect(() => {
        // Disable Lenis on touch devices (mobiles, tablets) to leverage native momentum scrolling
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) return;

        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({
            duration: 1.0,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 0.9,
            touchMultiplier: 1.5,
        });

        (window as any).lenis = lenis;

        // Synchronize Lenis scroll position with GSAP ScrollTrigger
        lenis.on("scroll", ScrollTrigger.update);

        // Drive Lenis directly via GSAP's central ticker so they stay in lockstep
        const updateTicker = (time: number) => {
            lenis.raf(time * 1000);
        };
        gsap.ticker.add(updateTicker);
        gsap.ticker.lagSmoothing(0);

        // Ensure triggers recalculate correctly after initial load and resize
        const handleRefresh = () => {
            lenis.resize();
            ScrollTrigger.refresh();
        };

        window.addEventListener("pageLoaded", handleRefresh);
        window.addEventListener("resize", handleRefresh);

        // Initial refresh once DOM is ready
        const timer = setTimeout(handleRefresh, 500);

        function onAnchorClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            const tempA = target.closest("a");
            if (!tempA) return;
            const a = tempA as HTMLAnchorElement;

            const href = a.getAttribute("href");
            if (!href || !href.startsWith("#")) return;

            e.preventDefault();
            lenis.scrollTo(href, { offset: -80, duration: 1.2 });
        }

        document.addEventListener("click", onAnchorClick);

        return () => {
            clearTimeout(timer);
            delete (window as any).lenis;
            gsap.ticker.remove(updateTicker);
            window.removeEventListener("pageLoaded", handleRefresh);
            window.removeEventListener("resize", handleRefresh);
            document.removeEventListener("click", onAnchorClick);
            lenis.destroy();
        };
    }, []);

    return null;
}
