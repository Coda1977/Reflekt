"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "./ui/Button";
import { parseWordDocument } from "@/lib/wordImporter";
import { useRouter } from "next/navigation";

export function ImportWordButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const createWorkbook = useMutation(api.workbooks.createWorkbook);
  const router = useRouter();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(docx|doc)$/i)) {
      setError("Please select a Word document (.docx or .doc)");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Parse the Word document
      const parsed = await parseWordDocument(file);

      // Create workbook in Convex
      const workbookId = await createWorkbook({
        title: parsed.title,
        sections: parsed.sections,
      });

      // Redirect to editor
      router.push(`/admin/workbooks/${workbookId}/edit`);
    } catch (err) {
      console.error("Error importing Word document:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import document. Please try again."
      );
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2 items-center">
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          isLoading={isProcessing}
        >
          {isProcessing ? "Importing..." : "📄 Import from Word"}
        </Button>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="text-gray-500 hover:text-gray-700 text-sm"
          title="How to format your Word document"
        >
          ℹ️
        </button>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {showInfo && (
        <div className="absolute top-full mt-2 right-0 z-50 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-900">Word Document Formatting Tips</h3>
            <button
              onClick={() => setShowInfo(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong className="text-gray-900">Structure:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li><strong>Heading 1</strong> → Section titles</li>
                <li><strong>Heading 2</strong> → Page titles</li>
                <li>Regular text → Text blocks</li>
              </ul>
            </div>

            <div>
              <strong className="text-gray-900">Questions/Input Fields:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Use <strong>colored text</strong> (any color except black)</li>
                <li>Use <strong>highlighted text</strong></li>
                <li>Add markers: <code className="bg-gray-100 px-1">[Q]</code>, <code className="bg-gray-100 px-1">[INPUT]</code>, or <code className="bg-gray-100 px-1">Q:</code></li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <strong className="text-blue-900 text-xs">Example:</strong>
              <p className="text-xs text-blue-800 mt-1">
                "What are your goals?" in <span className="text-blue-600">blue text</span> → Input field
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
