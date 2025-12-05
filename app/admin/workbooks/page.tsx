"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ImportWordButton } from "@/components/ImportWordButton";

export default function WorkbooksPage() {
  const workbooks = useQuery(api.workbooks.getWorkbooks);
  const deleteWorkbook = useMutation(api.workbooks.deleteWorkbook);
  const duplicateWorkbook = useMutation(api.workbooks.duplicateWorkbook);

  const [deletingId, setDeletingId] = useState<Id<"workbooks"> | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<Id<"workbooks"> | null>(null);

  if (workbooks === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleDelete = async (workbookId: Id<"workbooks">) => {
    if (!confirm("Are you sure you want to delete this workbook? This will also delete all client instances.")) {
      return;
    }

    setDeletingId(workbookId);
    try {
      await deleteWorkbook({ workbookId });
    } catch (error) {
      alert("Failed to delete workbook");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (workbookId: Id<"workbooks">) => {
    setDuplicatingId(workbookId);
    try {
      const newId = await duplicateWorkbook({ workbookId });
      // Could redirect to edit page
    } catch (error) {
      alert("Failed to duplicate workbook");
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black mb-2">Workbooks</h1>
          <p className="text-gray-600">Manage your workbook templates</p>
        </div>
        <div className="flex gap-3">
          <ImportWordButton />
          <Link href="/admin/workbooks/new">
            <Button variant="primary">Create New Workbook</Button>
          </Link>
        </div>
      </div>

      {/* Workbooks List */}
      {workbooks.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold mb-2">No workbooks yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first workbook to get started
          </p>
          <Link href="/admin/workbooks/new">
            <Button variant="primary">Create Workbook</Button>
          </Link>
        </Card>
      ) : (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sections
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workbooks.map((workbook) => {
                const totalPages = workbook.sections.reduce(
                  (sum, section) => sum + section.pages.length,
                  0
                );

                return (
                  <tr key={workbook._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {workbook.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {totalPages} pages
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {workbook.sections.length}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(workbook.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(workbook.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/workbooks/${workbook._id}/edit`}
                          className="text-accent-blue hover:text-accent-blue/80 font-semibold text-sm"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/workbooks/${workbook._id}/responses`}
                          className="text-gray-700 hover:text-gray-900 font-semibold text-sm"
                        >
                          Responses
                        </Link>
                        <button
                          onClick={() => handleDuplicate(workbook._id)}
                          disabled={duplicatingId === workbook._id}
                          className="text-gray-700 hover:text-gray-900 font-semibold text-sm disabled:opacity-50"
                        >
                          {duplicatingId === workbook._id ? "..." : "Duplicate"}
                        </button>
                        <button
                          onClick={() => handleDelete(workbook._id)}
                          disabled={deletingId === workbook._id}
                          className="text-red-600 hover:text-red-700 font-semibold text-sm disabled:opacity-50"
                        >
                          {deletingId === workbook._id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
