"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Id } from "@/convex/_generated/dataModel";
import { TiptapRenderer } from "@/components/editor/TiptapEditor";

export default function PreviewWorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const workbookId = params.id as Id<"workbooks">;

  const workbook = useQuery(api.workbooks.getWorkbook, { workbookId });

  if (workbook === undefined) {
    return <LoadingPage />;
  }

  if (workbook === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Workbook not found</h2>
          <Button onClick={() => router.push("/admin/workbooks")}>
            Back to Workbooks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header with Back Button */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-black">{workbook.title}</h1>
              <p className="text-sm text-gray-600">Preview Mode - Read Only</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => router.push(`/admin/workbooks/${workbookId}/edit`)}
              >
                ← Back to Editor
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Workbook Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-12">
          {workbook.sections.map((section) => (
            <div key={section.id} className="space-y-8">
              {/* Section Title */}
              <div className="border-l-4 border-accent-blue pl-4">
                <h2 className="text-3xl font-black text-gray-900">
                  {section.title}
                </h2>
              </div>

              {/* Pages */}
              {section.pages.map((page) => (
                <div key={page.id} className="bg-white rounded-xl p-8 shadow-sm">
                  {/* Page Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    {page.title}
                  </h3>

                  {/* Blocks */}
                  <div className="space-y-6">
                    {page.blocks.map((block: any) => (
                      <div key={block.id}>
                        {/* Text Block */}
                        {block.type === "text" && block.content && (
                          <div className="prose prose-gray max-w-none">
                            <TiptapRenderer content={block.content} />
                          </div>
                        )}

                        {/* Input Block */}
                        {block.type === "input" && (
                          <div className="space-y-2">
                            <label className="block font-semibold text-gray-900">
                              {block.label}
                            </label>
                            {block.multiline ? (
                              <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                                placeholder={block.placeholder || "Your response..."}
                                rows={4}
                                disabled
                              />
                            ) : (
                              <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                                placeholder={block.placeholder || "Your response..."}
                                disabled
                              />
                            )}
                          </div>
                        )}

                        {/* Checkbox Block */}
                        {block.type === "checkbox" && (
                          <div className="space-y-2">
                            <label className="block font-semibold text-gray-900">
                              {block.label}
                            </label>
                            <div className="space-y-2">
                              {block.options.map((option: any) => (
                                <label
                                  key={option.id}
                                  className="flex items-center gap-2 cursor-not-allowed"
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300"
                                    disabled
                                  />
                                  <span className="text-gray-700">{option.text}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Image Block */}
                        {block.type === "image" && block.url && (
                          <div>
                            <img
                              src={block.url}
                              alt={block.alt || ""}
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}

                        {/* iFrame Block */}
                        {block.type === "iframe" && block.url && (
                          <div>
                            <iframe
                              src={block.url}
                              width="100%"
                              height={block.height || "400"}
                              frameBorder="0"
                              allowFullScreen
                              className="rounded-lg border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {workbook.sections.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>This workbook has no content yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
