"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Printer } from "lucide-react";

interface QRCodeDisplayProps {
  value: string;
  title?: string;
  size?: number;
}

export function QRCodeDisplay({
  value,
  title,
  size = 256,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          errorCorrectionLevel: "H",
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error);
        }
      );

      QRCode.toDataURL(
        value,
        {
          width: size,
          margin: 2,
          errorCorrectionLevel: "H",
        },
        (error, url) => {
          if (!error) setDataUrl(url);
        }
      );
    }
  }, [value, size]);

  const handleDownload = () => {
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `qr-${title || value}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${title || value}</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column;
              align-items: center; 
              justify-content: center; 
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 40px;
            }
            img { 
              max-width: 100%; 
              height: auto; 
            }
            h2 {
              margin-top: 20px;
              font-size: 24px;
              color: #333;
            }
            @media print {
              body { margin: 0; }
              .qr-container { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${dataUrl}" alt="QR Code" />
            ${title ? `<h2>${title}</h2>` : ""}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!value) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="border rounded" />
        </div>

        {title && (
          <div className="text-center">
            <p className="font-medium text-sm text-gray-700">{title}</p>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!dataUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={!dataUrl}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>

        <div className="text-xs text-center text-gray-500 font-mono break-all">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
