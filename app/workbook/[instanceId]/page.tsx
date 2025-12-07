"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { TiptapRenderer } from "@/components/editor/TiptapEditor";
import { useAutoSave } from "@/hooks/useAutoSave";
import clsx from "clsx";

function ResponseInput({
  instanceId,
  block,
  existingResponse,
}: {
  instanceId: Id<"workbookInstances">;
  block: any;
  existingResponse?: string;
}) {
  // DEBUG LOGGING
  useEffect(() => {
    console.log(`[ResponseInput:${block.id}] MOUNTED. ExistingResponse:`, existingResponse);
    return () => {
      console.log(`[ResponseInput:${block.id}] UNMOUNTED.`);
    };
  }, [block.id]);

  useEffect(() => {
    console.log(`[ResponseInput:${block.id}] Prop Update. ExistingResponse:`, existingResponse);
  }, [existingResponse, block.id]);

  const { value, setValue, saving, error } = useAutoSave(
    instanceId,
    block.id,
    existingResponse || ""
  );

  return (
    <div className="space-y-2">
      <label className="block font-semibold text-gray-900">{block.label}</label>
      {block.multiline ? (
        <textarea
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          placeholder={block.placeholder || "Type your answer here..."}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent resize-y min-h-[120px]"
        />
      ) : (
        <input
          type="text"
          value={value as string}
          onChange={(e) => setValue(e.target.value)}
          placeholder={block.placeholder || "Type your answer here..."}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue focus:border-transparent"
        />
      )}
      {saving && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Saving...
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

function ResponseCheckbox({
  instanceId,
  block,
  existingResponse,
}: {
  instanceId: Id<"workbookInstances">;
  block: any;
  existingResponse?: string[];
}) {
  const { value, setValue, saving, error } = useAutoSave(
    instanceId,
    block.id,
    existingResponse || []
  );

  const handleToggle = (optionId: string) => {
    const currentValue = value as string[];
    if (currentValue.includes(optionId)) {
      setValue(currentValue.filter((id) => id !== optionId));
    } else {
      setValue([...currentValue, optionId]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block font-semibold text-gray-900">{block.label}</label>
      <div className="space-y-2">
        {block.options.map((option: any) => (
          <label
            key={option.id}
            className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={(value as string[]).includes(option.id)}
              onChange={() => handleToggle(option.id)}
              className="w-5 h-5 text-accent-blue rounded focus:ring-2 focus:ring-accent-blue"
            />
            <span className="text-gray-900">{option.text}</span>
          </label>
        ))}
      </div>
      {saving && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Saving...
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

export default function WorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const instanceId = params.instanceId as Id<"workbookInstances">;

  const user = useQuery(api.users.getCurrentUser);
  // Disable caching to always get fresh data
  const data = useQuery(api.workbookInstances.getInstanceWithWorkbook, { instanceId });

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Debug Log for Parent Data
  useEffect(() => {
    if (data?.instance?.responses) {
      console.log('[WorkbookPage] Data Updated. Responses keys:', Object.keys(data.instance.responses));
      console.log('[WorkbookPage] Full Responses Snapshot:', JSON.stringify(data.instance.responses));
    }
  }, [data]);

  // Redirect to login if not authenticated
  if (user === undefined || data === undefined) {
    return <LoadingPage />;
  }

  if (user === null) {
    router.push(`/login?redirect=${encodeURIComponent(`/workbook/${instanceId}`)}`);
    return <LoadingPage />;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Workbook Not Found</h1>
          <p className="text-gray-600 mb-4">This workbook may have been deleted.</p>
          <Button onClick={() => router.push("/home")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  const { workbook, instance, branding } = data;

  // Calculate progress
  const totalPages = workbook.sections.reduce((sum, s) => sum + s.pages.length, 0);
  const currentPageNumber =
    workbook.sections
      .slice(0, currentSectionIndex)
      .reduce((sum, s) => sum + s.pages.length, 0) +
    currentPageIndex +
    1;

  const currentSection = workbook.sections[currentSectionIndex];
  const currentPage = currentSection?.pages[currentPageIndex];

  const canGoPrevious = currentPageNumber > 1;
  const canGoNext = currentPageNumber < totalPages;

  const handlePrevious = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = workbook.sections[currentSectionIndex - 1];
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentPageIndex(prevSection.pages.length - 1);
    }
  };

  const handleNext = () => {
    if (currentPageIndex < currentSection.pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (currentSectionIndex < workbook.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentPageIndex(0);
    }
  };

  const handleDownload = async () => {
    // Dynamically import jsPDF to avoid SSR issues
    const { default: jsPDF } = await import("jspdf");

    // Helper to convert image URL to base64
    const getBase64Image = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error("Failed to load image:", err);
        throw err;
      }
    };

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper to add new page if needed
    const checkPageBreak = (neededSpace: number) => {
      if (yPosition + neededSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    // Helper to add text with wrapping
    const addText = (text: string, fontSize: number, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.5;

      checkPageBreak(lines.length * lineHeight);

      lines.forEach((line: string) => {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
    };

    // Title
    addText(workbook.title, 20, true);
    yPosition += 5;

    // Process each section
    for (const section of workbook.sections) {
      checkPageBreak(15);
      addText(section.title, 16, true);
      yPosition += 5;

      // Process each page in section
      for (const page of section.pages) {
        checkPageBreak(12);
        addText(page.title, 14, true);
        yPosition += 3;

        // Process each block
        for (const block of page.blocks) {
          if (block.type === "text") {
            // Add text block content
            checkPageBreak(10);
            // Strip HTML and add as plain text
            const textContent = block.content.replace(/<[^>]*>/g, "");
            addText(textContent, 11);
            yPosition += 3;
          } else if (block.type === "input") {
            // Add question label
            checkPageBreak(15);
            addText(block.label, 11, true);
            yPosition += 2;

            // Add response if exists
            const response = instance.responses[block.id] as string;
            if (response) {
              doc.setDrawColor(200);
              doc.setFillColor(245, 245, 245);
              const responseLines = doc.splitTextToSize(response || "(No response)", contentWidth - 10);
              const boxHeight = responseLines.length * 5.5 + 4;

              checkPageBreak(boxHeight);
              doc.roundedRect(margin, yPosition, contentWidth, boxHeight, 2, 2, "FD");

              yPosition += 4;
              doc.setFontSize(10);
              doc.setFont("helvetica", "normal");
              responseLines.forEach((line: string) => {
                doc.text(line, margin + 3, yPosition);
                yPosition += 5.5;
              });
              yPosition += 2;
            } else {
              addText("(No response)", 10);
              yPosition += 2;
            }
            yPosition += 3;
          } else if (block.type === "checkbox") {
            // Add checkbox question
            checkPageBreak(15);
            addText(block.label, 11, true);
            yPosition += 2;

            const selectedIds = (instance.responses[block.id] as string[]) || [];
            if (selectedIds.length > 0) {
              const selectedTexts = block.options
                .filter((opt: any) => selectedIds.includes(opt.id))
                .map((opt: any) => opt.text);

              selectedTexts.forEach((text: string) => {
                checkPageBreak(8);
                doc.setFontSize(10);
                doc.text("☑ " + text, margin + 5, yPosition);
                yPosition += 6;
              });
            } else {
              addText("(No selections)", 10);
              yPosition += 2;
            }
            yPosition += 3;
          } else if (block.type === "image" && block.url) {
            // Add image
            try {
              checkPageBreak(60);

              // Convert image to base64 to avoid CORS issues
              const base64Image = await getBase64Image(block.url);

              const imgWidth = contentWidth * 0.8;
              const imgHeight = 50; // Fixed height for consistency

              doc.addImage(base64Image, "JPEG", margin + (contentWidth - imgWidth) / 2, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 5;
            } catch (err) {
              console.warn("Failed to add image to PDF:", err);
              addText("[Image could not be loaded]", 10);
              yPosition += 3;
            }
          }
        }
        yPosition += 5;
      }
      yPosition += 5;
    }

    // Save the PDF
    doc.save(`${workbook.title.replace(/[^a-z0-9]/gi, "_")}_responses.pdf`);
  };

  const isCompleted = currentPageNumber === totalPages;

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header
        className="bg-white border-b border-gray-200"
        style={
          branding?.primaryColor
            ? { backgroundColor: branding.primaryColor, color: "white" }
            : undefined
        }
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black">{workbook.title}</h1>
              <p className="text-sm opacity-90">
                Page {currentPageNumber} of {totalPages}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/home")}
            >
              Exit
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-gray-200 h-2">
        <div
          className="h-full bg-accent-blue transition-all duration-300"
          style={{ width: `${(currentPageNumber / totalPages) * 100}%` }}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Section Title */}
          <div className="mb-8">
            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {currentSection.title}
            </div>
            <h2 className="text-3xl font-black text-gray-900">
              {currentPage.title}
            </h2>
          </div>

          {/* Blocks - Using stable keys to prevent unnecessary re-mounts */}
          <div className="space-y-8">
            {currentPage.blocks.map((block: any) => (
              <div key={`${instanceId}-${block.id}`}>
                {block.type === "text" && (
                  <div className="prose prose-lg max-w-none">
                    <TiptapRenderer content={block.content} />
                  </div>
                )}

                {block.type === "input" && (
                  <ResponseInput
                    key={`input-${instanceId}-${block.id}`}
                    instanceId={instanceId}
                    block={block}
                    existingResponse={instance.responses[block.id] as string}
                  />
                )}

                {block.type === "checkbox" && (
                  <ResponseCheckbox
                    key={`checkbox-${instanceId}-${block.id}`}
                    instanceId={instanceId}
                    block={block}
                    existingResponse={instance.responses[block.id] as string[]}
                  />
                )}

                {block.type === "image" && block.url && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={block.url}
                      alt={block.alt || ""}
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-12 flex justify-between items-center pt-8 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={!canGoPrevious}
            >
              ← Previous
            </Button>

            <div className="text-sm text-gray-500">
              {currentPageNumber} / {totalPages}
            </div>

            {isCompleted ? (
              <Button
                variant="primary"
                onClick={handleDownload}
              >
                Download Responses ⬇
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
              >
                Next →
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
