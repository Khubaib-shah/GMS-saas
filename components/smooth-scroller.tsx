"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroller() {
    useEffect(() => {
        // Disable Lenis on touch devices (mobiles, tablets) to leverage native momentum scrolling
        const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice) return;

        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: "vertical",
            gestureOrientation: "vertical",
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        function onAnchorClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            const tempA = target.closest("a");
            if (!tempA) return;
            const a = tempA as HTMLAnchorElement;

            const href = a.getAttribute("href");
            if (!href || !href.startsWith("#")) return;

            e.preventDefault();
            lenis.scrollTo(href);
        }

        document.addEventListener("click", onAnchorClick);

        return () => {
            lenis.destroy();
            document.removeEventListener("click", onAnchorClick);
        };
    }, []);

    return null;
}
