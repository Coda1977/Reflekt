"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  workbookId: Id<"workbooks">;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ workbookId, isOpen, onClose }: QRCodeModalProps) {
  const [copied, setCopied] = useState(false);

  // Simple URL - points to workbook, not instance
  // System will auto-create instances for each client
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/workbook/join/${workbookId}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const canvas = document.getElementById("qr-code") as HTMLCanvasElement;
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "workbook-qr-code.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black mb-1">Share Workbook</h2>
            <p className="text-gray-600">
              Share this QR code or link with all your clients
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white p-8 rounded-lg flex justify-center">
            <QRCodeSVG
              id="qr-code"
              value={url}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                readOnly
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <Button
                variant={copied ? "primary" : "secondary"}
                size="sm"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              ✨ This single QR code works for all clients! Each client gets their own private workbook instance.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="primary" onClick={handleDownload} className="flex-1">
              Download QR Code
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 How to use:</h4>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Download or print this QR code</li>
              <li>2. Share it with all your clients (email, print, etc.)</li>
              <li>3. Each client scans the same code</li>
              <li>4. System automatically creates a private workbook for each client</li>
              <li>5. Responses are auto-saved and isolated per client</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}
