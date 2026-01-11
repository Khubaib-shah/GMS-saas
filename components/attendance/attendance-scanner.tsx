"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { Scan, RotateCcw, Camera, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useZxing } from "react-zxing";

export function AttendanceScanner() {
  const store = useAppStore();
  const [scanValue, setScanValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCheckout, setIsCheckout] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const [useCamera, setUseCamera] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // react-zxing hook
  const { ref } = useZxing({
    paused: !useCamera,
    onResult(result) {
      if (result && !loading) {
         processAttendance(result.getText());
      }
    },
    onError(error) {
        // Suppress common errors
        // NotFoundException: No QR code found (normal scanning)
        // IndexSizeError: Video not ready yet (safe to ignore, will pass)
        if (error.name !== "NotFoundException" && error.name !== "IndexSizeError") {
            console.error(error);
            toast.error(`Camera Error: ${error.name} - ${error.message}`);
        }
    },
    constraints: {
      video: {
        facingMode: facingMode,
      },
      audio: false,
    },
  });

  // Auto-focus the input on mount if using keyboard
  useEffect(() => {
    if (!useCamera) {
      inputRef.current?.focus();
      setIsVideoReady(false);
    }
  }, [useCamera]);

  const processAttendance = async (member: string) => {
    if (!member) return;

    const memberId = member.split(" ")[0];
    const memberName = member.split(" ")[1];

    console.log(memberId);  
    setLoading(true);
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark attendance");
      }

      toast.success(
        `[${memberName}] Successfully ${isCheckout ? "Checked Out" : "Checked In"}`
      );
    } catch (error: any) {
        // Prevent toast spam if it's just a duplicate scan quickly
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
                ref={ref} 
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
            <form onSubmit={handleManualScan} className="flex gap-2">
                <Input
                ref={inputRef}
                placeholder="Scan or type Member ID..."
                value={scanValue}
                onChange={(e) => setScanValue(e.target.value)}
                disabled={loading}
                autoComplete="off"
                />
                <Button type="submit" disabled={loading}>
                {loading ? "..." : "Enter"}
                </Button>
            </form>
            <div className="flex justify-end mt-2">
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
     
      <p className="text-xs text-muted-foreground mt-2">
        {useCamera 
            ? "Allow camera access when prompted." 
            : "Click inside the box and scan the member's QR/Barcode."}
      </p>
    </div>
  );
}
