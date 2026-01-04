"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { Printer, X } from "lucide-react";
import { useRef } from "react";

interface MemberQrDialogProps {
  memberId: string;
  memberName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MemberQrDialog({
  memberId,
  memberName,
  open,
  onOpenChange,
}: MemberQrDialogProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=600,height=600");
    if (!printWindow) return;

    // Get the SVG content
    const svgContent = qrRef.current?.innerHTML || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Member QR - ${memberName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: sans-serif;
              padding: 40px;
            }
            .card {
              border: 2px solid #000;
              padding: 20px;
              border-radius: 12px;
              text-align: center;
            }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { font-size: 14px; color: #555; }
            svg { max-width: 100%; height: auto; }
          </style>
        </head>
        <body>
          <div class="card">
             <h1>${memberName}</h1>
             <div style="margin: 20px 0;">
                ${svgContent}
             </div>
             <p>Member ID: ${memberId}</p>
          </div>
          <script>
            setTimeout(() => {
                window.print();
                window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Member QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-6 space-y-6">
          <div
            ref={qrRef}
            className="p-4 bg-white rounded-lg shadow-sm border"
            style={{ width: "fit-content" }}
          >
            {/* QRCode renders an SVG, ensuring sharp prints */}
            <QRCode
              value={memberId + memberName}
              size={200}
              level="H" // High error correction
            />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{memberName}</h3>
            <p className="text-sm text-muted-foreground font-mono mt-1 text-xs">
              {memberId}
            </p>
          </div>

          <div className="flex gap-2 w-full">
            <Button className="flex-1 gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Print Card
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
