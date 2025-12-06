"use client";

import { useState } from "react";
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
  const data = useQuery(api.workbookInstances.getInstanceWithWorkbook, { instanceId });

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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

          {/* Blocks */}
          <div className="space-y-8">
            {currentPage.blocks.map((block: any) => (
              <div key={block.id}>
                {block.type === "text" && (
                  <div className="prose prose-lg max-w-none">
                    <TiptapRenderer content={block.content} />
                  </div>
                )}

                {block.type === "input" && (
                  <ResponseInput
                    instanceId={instanceId}
                    block={block}
                    existingResponse={instance.responses[block.id] as string}
                  />
                )}

                {block.type === "checkbox" && (
                  <ResponseCheckbox
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

            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              {canGoNext ? "Next →" : "Completed ✓"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
