"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { TiptapRenderer } from "@/components/editor/TiptapEditor";

export default function ClientResponsePage() {
  const params = useParams();
  const router = useRouter();
  const instanceId = params.instanceId as Id<"workbookInstances">;

  const data = useQuery(api.workbookInstances.getInstanceWithWorkbook, { instanceId });

  if (data === undefined) {
    return <LoadingPage />;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Response Not Found</h1>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const { workbook, instance, branding } = data;
  const responseCount = Object.keys(instance.responses).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black mb-2">{workbook.title}</h1>
          <p className="text-gray-600">
            Client Response {instance.completedAt && "• Completed"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.back()}>
            Back to Responses
          </Button>
          <Button variant="ghost">Export PDF</Button>
        </div>
      </div>

      {/* Client Info */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-1">Client</div>
            <div className="text-lg font-bold text-gray-900">
              {instance.clientId ? "Registered Client" : "Anonymous"}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-1">
              Responses
            </div>
            <div className="text-lg font-bold text-gray-900">
              {responseCount} answers
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-600 mb-1">
              Last Updated
            </div>
            <div className="text-lg font-bold text-gray-900">
              {new Date(instance.lastUpdatedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Workbook Content with Responses */}
      <div className="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-12">
        {workbook.sections.map((section) => (
          <div key={section.id} className="border-l-4 border-accent-blue pl-8">
            {/* Section Title */}
            <h2 className="text-3xl font-black text-gray-900 mb-8">
              {section.title}
            </h2>

            {/* Pages */}
            {section.pages.map((page) => (
              <div key={page.id} className="mb-10">
                {/* Page Title */}
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {page.title}
                </h3>

                {/* Blocks */}
                <div className="space-y-6">
                  {page.blocks.map((block: any) => (
                    <div key={block.id}>
                      {/* Text Block */}
                      {block.type === "text" && (
                        <div className="prose prose-lg max-w-none text-gray-700">
                          <TiptapRenderer content={block.content} />
                        </div>
                      )}

                      {/* Input Block with Response */}
                      {block.type === "input" && (
                        <div className="bg-blue-50 rounded-lg p-6">
                          <div className="font-semibold text-gray-900 mb-3">
                            {block.label}
                          </div>
                          <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                            {instance.responses[block.id] ? (
                              <div className="text-gray-900 whitespace-pre-wrap">
                                {instance.responses[block.id] as string}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic">No response</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Checkbox Block with Response */}
                      {block.type === "checkbox" && (
                        <div className="bg-green-50 rounded-lg p-6">
                          <div className="font-semibold text-gray-900 mb-3">
                            {block.label}
                          </div>
                          <div className="space-y-2">
                            {block.options.map((option: any) => {
                              const selected = Array.isArray(
                                instance.responses[block.id]
                              )
                                ? (instance.responses[block.id] as string[]).includes(
                                    option.id
                                  )
                                : false;

                              return (
                                <div
                                  key={option.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border-2 ${
                                    selected
                                      ? "bg-white border-green-500"
                                      : "bg-white border-gray-200"
                                  }`}
                                >
                                  <div
                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      selected
                                        ? "bg-green-500 border-green-500"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {selected && (
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-gray-900">{option.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Image Block */}
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
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
