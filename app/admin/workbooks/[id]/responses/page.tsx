"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { TiptapRenderer } from "@/components/editor/TiptapEditor";

export default function WorkbookResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const workbookId = params.id as Id<"workbooks">;

  const workbook = useQuery(api.workbooks.getWorkbook, { workbookId });
  const instances = useQuery(api.workbookInstances.getWorkbookInstances, { workbookId });

  if (workbook === undefined || instances === undefined) {
    return <LoadingPage />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black mb-2">{workbook.title}</h1>
          <p className="text-gray-600">Client Responses</p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {/* Responses List */}
      {instances.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-2xl font-bold mb-2">No responses yet</h3>
          <p className="text-gray-600 mb-6">
            When clients complete this workbook, their responses will appear here
          </p>
          <Link href={`/admin/workbooks/${workbookId}/edit`}>
            <Button variant="primary">Edit Workbook</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-6">
          {instances.map((instance) => {
            const client = instance.client;
            const responseCount = Object.keys(instance.responses).length;
            const isCompleted = !!instance.completedAt;

            return (
              <Card key={instance._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {client?.email || "Anonymous"}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                      <span>{responseCount} responses</span>
                      <span>•</span>
                      <span>
                        Last updated:{" "}
                        {new Date(instance.lastUpdatedAt).toLocaleDateString()}
                      </span>
                      {isCompleted && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 font-semibold">
                            ✓ Completed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link href={`/admin/workbooks/${workbookId}/responses/${instance._id}`}>
                    <Button variant="secondary" size="sm">
                      View Full Response
                    </Button>
                  </Link>
                </div>

                {/* Summary of responses */}
                {responseCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-600 mb-3">
                      Response Summary:
                    </h4>
                    <div className="grid gap-2">
                      {workbook.sections.slice(0, 1).map((section) =>
                        section.pages.slice(0, 1).map((page) =>
                          page.blocks.slice(0, 3).map((block: any) => {
                            const response = instance.responses[block.id];
                            if (!response || block.type === "text" || block.type === "image")
                              return null;

                            return (
                              <div
                                key={block.id}
                                className="text-sm bg-gray-50 p-3 rounded"
                              >
                                <div className="font-semibold text-gray-700 mb-1">
                                  {block.label}
                                </div>
                                <div className="text-gray-600">
                                  {Array.isArray(response)
                                    ? block.options
                                        ?.filter((opt: any) =>
                                          response.includes(opt.id)
                                        )
                                        .map((opt: any) => opt.text)
                                        .join(", ") || "—"
                                    : response || "—"}
                                </div>
                              </div>
                            );
                          })
                        )
                      )}
                      {responseCount > 3 && (
                        <p className="text-sm text-gray-500 italic">
                          + {responseCount - 3} more responses...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Stats */}
      {instances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-3xl font-black text-accent-blue mb-1">
              {instances.length}
            </div>
            <div className="text-sm text-gray-600">Total Responses</div>
          </Card>
          <Card>
            <div className="text-3xl font-black text-green-600 mb-1">
              {instances.filter((i) => i.completedAt).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </Card>
          <Card>
            <div className="text-3xl font-black text-accent-yellow mb-1">
              {instances.filter((i) => i.startedAt && !i.completedAt).length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </Card>
        </div>
      )}
    </div>
  );
}
