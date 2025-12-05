"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { QRCodeSVG } from "qrcode.react";

interface QRCodeModalProps {
  workbookId: Id<"workbooks">;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ workbookId, isOpen, onClose }: QRCodeModalProps) {
  const createInstance = useMutation(api.workbookInstances.createInstance);
  const [instanceId, setInstanceId] = useState<Id<"workbookInstances"> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const instance = useQuery(
    api.workbookInstances.getInstance,
    instanceId ? { instanceId } : "skip"
  );

  useEffect(() => {
    if (isOpen && !instanceId && !isCreating) {
      handleCreateInstance();
    }
  }, [isOpen]);

  const handleCreateInstance = async () => {
    setIsCreating(true);
    try {
      const newInstanceId = await createInstance({ workbookId });
      setInstanceId(newInstanceId);
    } catch (error) {
      alert("Failed to generate QR code");
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const url = instance
    ? `${window.location.origin}/workbook/${instance._id}?invite=${instance.inviteToken}`
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
              Generate a QR code or share the link with your clients
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {isCreating || !instance ? (
          <div className="py-12 text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Generating QR code...</p>
          </div>
        ) : (
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
                Each QR code is unique to this workbook instance. Clients who scan it will
                be prompted to sign up or log in.
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
                <li>1. Download the QR code image</li>
                <li>2. Print it or share it digitally with your client</li>
                <li>3. Client scans the code or opens the link</li>
                <li>4. Client signs up/logs in and gets access to the workbook</li>
                <li>5. Their responses are auto-saved as they work</li>
              </ol>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
