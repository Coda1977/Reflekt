"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function NewWorkbookPage() {
  const router = useRouter();
  const createWorkbook = useMutation(api.workbooks.createWorkbook);

  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setIsLoading(true);

    try {
      // Create workbook with one empty section
      const workbookId = await createWorkbook({
        title: title.trim(),
        sections: [
          {
            id: crypto.randomUUID(),
            title: "Section 1",
            pages: [
              {
                id: crypto.randomUUID(),
                title: "Page 1",
                blocks: [],
              },
            ],
          },
        ],
      });

      // Redirect to editor
      router.push(`/admin/workbooks/${workbookId}/edit`);
    } catch (err) {
      setError("Failed to create workbook. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-black mb-2">Create New Workbook</h1>
        <p className="text-gray-600">
          Start by giving your workbook a title. You can add sections, pages, and blocks in the editor.
        </p>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Workbook Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Leadership Reflection Workbook"
            required
            error={error}
            helperText="Choose a descriptive name for your workbook"
          />

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="flex-1"
            >
              Create Workbook
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Tips */}
      <Card className="bg-blue-50">
        <h3 className="font-bold text-lg mb-3">💡 Getting Started</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Your workbook will start with one section and one page</li>
          <li>• Add text blocks for instructions</li>
          <li>• Add input blocks for client responses</li>
          <li>• Add checkbox blocks for multiple-choice questions</li>
          <li>• Add images to make it visually engaging</li>
          <li>• Generate a QR code to share with clients</li>
        </ul>
      </Card>
    </div>
  );
}
