"use client";

import { useState, useRef, useEffect } from "react";
import { InputField } from "@/components/ui/input-field";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { Scan, RotateCcw, Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { AttendanceResult } from "./attendance-result";
import { div } from "three/src/nodes/math/OperatorNode.js";

export function AttendanceScanner() {
  const store = useAppStore();
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [useCamera, setUseCamera] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isWindowVisible, setIsWindowVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);
  const loadingRef = useRef(loading);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsWindowVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!useCamera || !isWindowVisible) {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      setIsVideoReady(false);

      if (!useCamera) {
        inputRef.current?.focus();
      }
      return;
    }

    let isMounted = true;
    const codeReader = new BrowserMultiFormatReader();

    if (videoRef.current) {
      codeReader.decodeFromConstraints(
        { video: { facingMode: facingMode } },
        videoRef.current,
        (result, err, controls) => {
          if (!isMounted) return;
          if (controls && !controlsRef.current) {
            controlsRef.current = controls;
          }
          if (result) {
            if (!loadingRef.current) {
              processAttendance(result.getText());
            }
          }
        }
      ).then((controls) => {
        if (!isMounted) {
          controls.stop();
        } else {
          controlsRef.current = controls;
        }
      }).catch(err => {
        console.error(err);
        toast.error(`Camera Error: ${err.message || err}`);
      });
    }

    return () => {
      isMounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [useCamera, facingMode, isWindowVisible]);

  const processAttendance = async (member: string) => {
    if (!member) return;

    const memberId = member.split(" ")[0];
    const memberName = member.split(" ")[1];

    setLoading(true);
    setResult(null);
    try {
      const endpoint = isCheckout
        ? "/api/attendance/check-out"
        : "/api/attendance/check-in";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: memberId,
          gymId: store.gymProfile?._id,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      setResult(data);
      toast.success(
        `[${data.member?.fullName || memberName}] Successfully ${isCheckout ? "Checked Out" : "Checked In"}`
      );
    } catch (error: any) {
      if (!error.message.includes("already checked in")) {
        toast.error(error.message);
      } else {
        toast.warning(error.message);
      }
    } finally {
      setLoading(false);
      setScanValue("");
      if (!useCamera) {
        inputRef.current?.focus();
      }
    }
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanValue.trim()) return;
    await processAttendance(scanValue.trim());
  };

  // Update UI to include Flip Camera button
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scan className="w-5 h-5" /> Quick Scan
        </h3>
        <div className="flex gap-2">
          <Button
            variant={useCamera ? "default" : "outline"}
            size="sm"
            onClick={() => setUseCamera(true)}
          >
            <Camera className="w-4 h-4 mr-1" /> Camera
          </Button>
          <Button
            variant={!useCamera ? "default" : "outline"}
            size="sm"
            onClick={() => setUseCamera(false)}
          >
            <Keyboard className="w-4 h-4 mr-1" /> Hardware/Type
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Checkbox
          id="scanner-checkout-mode"
          checked={isCheckout}
          onCheckedChange={(checked) => setIsCheckout(checked as boolean)}
        />
        <Label htmlFor="scanner-checkout-mode">Mark as Check-out</Label>
      </div>

      {useCamera ? (
        <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center min-h-[300px]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onCanPlay={() => setIsVideoReady(true)}
            className="w-full h-full object-cover"
          />

          {/* Flip Camera Button */}
          <div className="absolute top-2 right-2 z-20">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none"
              onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
              title="Flip Camera"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="absolute inset-0 pointer-events-none border-2 border-primary/50 m-12 rounded-lg flex items-center justify-center">
            <p className="text-white/50 text-sm mt-32">Place QR code in frame</p>
          </div>

          {(!isVideoReady || loading) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-10">
              {loading ? "Processing..." : "Starting Camera..."}
            </div>
          )}
        </div>
      ) : (
        <>
          <form onSubmit={handleManualScan} className="flex">
            <InputField
              ref={inputRef}
              hideLabel
              validateType="text"
              placeholder="Scan or type Member ID..."
              value={scanValue}
              onChange={(val) => setScanValue(val)}
              disabled={loading}
              className="w-full border-r-0 rounded-r-none"
              autoComplete="off"
            />
            <Button type="submit" disabled={loading} className="h-12 px-6 rounded-r-md rounded-l-none text-[10px] font-black  bg-primary text-primary-foreground transition-all">
              {loading ? "..." : "Enter"}
            </Button>
          </form>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-muted-foreground mt-2">
              {useCamera
                ? "Allow camera access when prompted."
                : "Click inside the box and scan the member's QR/Barcode."}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.focus()}
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Refocus Input
            </Button>
          </div>
        </>
      )}



      {result && (
        <div className="mt-6">
          <AttendanceResult
            data={result}
            isCheckout={isCheckout}
            onClose={() => setResult(null)}
          />
        </div>
      )}
    </div>
  );
}
