"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { LoadingPage } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { QRCodeModal } from "@/components/QRCodeModal";
import clsx from "clsx";

type BlockType = "text" | "input" | "checkbox" | "image" | "iframe";

export default function EditWorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const workbookId = params.id as Id<"workbooks">;

  const workbook = useQuery(api.workbooks.getWorkbook, { workbookId });
  const updateWorkbook = useMutation(api.workbooks.updateWorkbook);

  const [localWorkbook, setLocalWorkbook] = useState<typeof workbook>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  // Initialize local state when workbook loads
  if (workbook && !localWorkbook) {
    setLocalWorkbook(workbook);
  }

  if (workbook === undefined || localWorkbook === null) {
    return <LoadingPage />;
  }

  const handleSave = async () => {
    if (!localWorkbook) return;

    setIsSaving(true);
    try {
      await updateWorkbook({
        workbookId,
        title: localWorkbook.title,
        sections: localWorkbook.sections,
      });
    } catch (error) {
      alert("Failed to save workbook");
    } finally {
      setIsSaving(false);
    }
  };

  const addSection = () => {
    if (!localWorkbook) return;

    setLocalWorkbook({
      ...localWorkbook,
      sections: [
        ...localWorkbook.sections,
        {
          id: crypto.randomUUID(),
          title: `Section ${localWorkbook.sections.length + 1}`,
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
  };

  const addPage = (sectionId: string) => {
    if (!localWorkbook) return;

    setLocalWorkbook({
      ...localWorkbook,
      sections: localWorkbook.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              pages: [
                ...section.pages,
                {
                  id: crypto.randomUUID(),
                  title: `Page ${section.pages.length + 1}`,
                  blocks: [],
                },
              ],
            }
          : section
      ),
    });
  };

  const deleteSection = (sectionId: string) => {
    if (!localWorkbook) return;
    if (!confirm("Are you sure you want to delete this section?")) return;

    setLocalWorkbook({
      ...localWorkbook,
      sections: localWorkbook.sections.filter((section) => section.id !== sectionId),
    });
  };

  const deletePage = (sectionId: string, pageId: string) => {
    if (!localWorkbook) return;
    if (!confirm("Are you sure you want to delete this page?")) return;

    setLocalWorkbook({
      ...localWorkbook,
      sections: localWorkbook.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              pages: section.pages.filter((page) => page.id !== pageId),
            }
          : section
      ),
    });
  };

  const addBlock = (sectionId: string, pageId: string, blockType: BlockType) => {
    if (!localWorkbook) return;

    const newBlock: any = {
      id: crypto.randomUUID(),
      type: blockType,
    };

    // Set default values based on block type
    switch (blockType) {
      case "text":
        newBlock.content = JSON.stringify({ type: "doc", content: [] });
        break;
      case "input":
        newBlock.label = "Your question here";
        newBlock.placeholder = "";
        newBlock.multiline = false;
        break;
      case "checkbox":
        newBlock.label = "Select all that apply";
        newBlock.options = [
          { id: crypto.randomUUID(), text: "Option 1" },
          { id: crypto.randomUUID(), text: "Option 2" },
        ];
        break;
      case "image":
        newBlock.url = "";
        newBlock.alt = "";
        break;
      case "iframe":
        newBlock.url = "";
        newBlock.height = "400";
        break;
    }

    setLocalWorkbook({
      ...localWorkbook,
      sections: localWorkbook.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              pages: section.pages.map((page) =>
                page.id === pageId
                  ? { ...page, blocks: [...page.blocks, newBlock] }
                  : page
              ),
            }
          : section
      ),
    });
  };

  const updateBlock = (sectionId: string, pageId: string, blockId: string, updates: any) => {
    if (!localWorkbook) return;

    setLocalWorkbook({
      ...localWorkbook,
      sections: localWorkbook.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              pages: section.pages.map((page) =>
                page.id === pageId
                  ? {
                      ...page,
                      blocks: page.blocks.map((block: any) =>
                        block.id === blockId ? { ...block, ...updates } : block
                      ),
                    }
                  : page
              ),
            }
          : section
      ),
    });
  };

  const deleteBlock = (sectionId: string, pageId: string, blockId: string) => {
    if (!localWorkbook) return;

    setLocalWorkbook({
      ...localWorkbook,
      sections: localWorkbook.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              pages: section.pages.map((page) =>
                page.id === pageId
                  ? {
                      ...page,
                      blocks: page.blocks.filter((block: any) => block.id !== blockId),
                    }
                  : page
              ),
            }
          : section
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 max-w-xl">
          <Input
            value={localWorkbook.title}
            onChange={(e) => setLocalWorkbook({ ...localWorkbook, title: e.target.value })}
            className="text-2xl font-bold"
            placeholder="Workbook Title"
          />
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/workbooks/${workbookId}/preview`)}
          >
            👁️ Preview
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowQRModal(true)}
          >
            Generate QR Code
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isSaving}
          >
            Save Changes
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/workbooks")}
          >
            Back
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Add Elements */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl p-4 sticky top-4">
            <h3 className="font-bold mb-4">Add Elements</h3>
            <div className="space-y-2">
              <button
                onClick={addSection}
                className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-sm transition-colors"
              >
                + Add Section
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="col-span-9">
          <div className="bg-white rounded-xl p-8 space-y-8">
            {localWorkbook.sections.map((section, sectionIndex) => (
              <div key={section.id} className="border-l-4 border-accent-blue pl-6">
                {/* Section Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <Input
                      value={section.title}
                      onChange={(e) => {
                        const newSections = [...localWorkbook.sections];
                        newSections[sectionIndex] = { ...section, title: e.target.value };
                        setLocalWorkbook({ ...localWorkbook, sections: newSections });
                      }}
                      className="text-xl font-bold flex-1"
                      placeholder="Section Title"
                    />
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold"
                      title="Delete Section"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <button
                    onClick={() => addPage(section.id)}
                    className="mt-2 text-sm text-accent-blue hover:underline"
                  >
                    + Add Page
                  </button>
                </div>

                {/* Pages */}
                {section.pages.map((page, pageIndex) => (
                  <div key={page.id} className="mb-8 p-6 border border-gray-200 rounded-lg">
                    {/* Page Header */}
                    <div className="mb-4 flex items-center gap-3">
                      <Input
                        value={page.title}
                        onChange={(e) => {
                          const newSections = [...localWorkbook.sections];
                          newSections[sectionIndex].pages[pageIndex] = {
                            ...page,
                            title: e.target.value,
                          };
                          setLocalWorkbook({ ...localWorkbook, sections: newSections });
                        }}
                        className="font-semibold flex-1"
                        placeholder="Page Title"
                      />
                      <button
                        onClick={() => deletePage(section.id, page.id)}
                        className="text-red-600 hover:text-red-700 text-xs font-semibold"
                        title="Delete Page"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Blocks */}
                    <div className="space-y-4">
                      {page.blocks.map((block: any) => (
                        <div key={block.id} className="p-4 bg-gray-50 rounded-lg">
                          {/* Block Type Indicator */}
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-semibold text-gray-600 uppercase">
                              {block.type} Block
                            </span>
                            <button
                              onClick={() => deleteBlock(section.id, page.id, block.id)}
                              className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            >
                              Delete
                            </button>
                          </div>

                          {/* Block Content */}
                          {block.type === "text" && (
                            <TiptapEditor
                              content={block.content}
                              onChange={(content) =>
                                updateBlock(section.id, page.id, block.id, { content })
                              }
                              placeholder="Enter your text here..."
                            />
                          )}

                          {block.type === "input" && (
                            <div className="space-y-2">
                              <Input
                                label="Question Label"
                                value={block.label}
                                onChange={(e) =>
                                  updateBlock(section.id, page.id, block.id, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Enter your question"
                              />
                              <Input
                                label="Placeholder (optional)"
                                value={block.placeholder || ""}
                                onChange={(e) =>
                                  updateBlock(section.id, page.id, block.id, {
                                    placeholder: e.target.value,
                                  })
                                }
                                placeholder="e.g., Type your answer here..."
                              />
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={block.multiline}
                                  onChange={(e) =>
                                    updateBlock(section.id, page.id, block.id, {
                                      multiline: e.target.checked,
                                    })
                                  }
                                />
                                <span className="text-sm">Multiline input</span>
                              </label>
                            </div>
                          )}

                          {block.type === "checkbox" && (
                            <div className="space-y-2">
                              <Input
                                label="Question Label"
                                value={block.label}
                                onChange={(e) =>
                                  updateBlock(section.id, page.id, block.id, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Enter your question"
                              />
                              <div className="space-y-2 mt-2">
                                <label className="text-sm font-semibold">Options:</label>
                                {block.options.map((option: any, optIndex: number) => (
                                  <div key={option.id} className="flex gap-2">
                                    <Input
                                      value={option.text}
                                      onChange={(e) => {
                                        const newOptions = [...block.options];
                                        newOptions[optIndex] = { ...option, text: e.target.value };
                                        updateBlock(section.id, page.id, block.id, {
                                          options: newOptions,
                                        });
                                      }}
                                      placeholder={`Option ${optIndex + 1}`}
                                    />
                                    <button
                                      onClick={() => {
                                        const newOptions = block.options.filter(
                                          (_: any, i: number) => i !== optIndex
                                        );
                                        updateBlock(section.id, page.id, block.id, {
                                          options: newOptions,
                                        });
                                      }}
                                      className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => {
                                    updateBlock(section.id, page.id, block.id, {
                                      options: [
                                        ...block.options,
                                        {
                                          id: crypto.randomUUID(),
                                          text: `Option ${block.options.length + 1}`,
                                        },
                                      ],
                                    });
                                  }}
                                  className="text-sm text-accent-blue hover:underline"
                                >
                                  + Add Option
                                </button>
                              </div>
                            </div>
                          )}

                          {block.type === "image" && (
                            <div className="space-y-2">
                              <Input
                                label="Image URL"
                                value={block.url}
                                onChange={(e) =>
                                  updateBlock(section.id, page.id, block.id, {
                                    url: e.target.value,
                                  })
                                }
                                placeholder="Enter image URL"
                              />
                              <Input
                                label="Alt Text (optional)"
                                value={block.alt || ""}
                                onChange={(e) =>
                                  updateBlock(section.id, page.id, block.id, {
                                    alt: e.target.value,
                                  })
                                }
                                placeholder="Describe the image"
                              />
                              {block.url && (
                                <img
                                  src={block.url}
                                  alt={block.alt || ""}
                                  className="mt-2 max-w-full h-auto rounded-lg"
                                />
                              )}
                            </div>
                          )}

                          {block.type === "iframe" && (
                            <div className="space-y-2">
                              <Input
                                label="iFrame URL (e.g., YouTube embed, Google Form, etc.)"
                                value={block.url}
                                onChange={(e) =>
                                  updateBlock(section.id, page.id, block.id, {
                                    url: e.target.value,
                                  })
                                }
                                placeholder="Enter iframe embed URL"
                              />
                              <Input
                                label="Height (px)"
                                value={block.height || "400"}
                                onChange={(e) =>
                                  updateBlock(section.id, page.id, block.id, {
                                    height: e.target.value,
                                  })
                                }
                                placeholder="400"
                              />
                              {block.url && (
                                <div className="mt-2">
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
                          )}
                        </div>
                      ))}

                      {/* Add Block Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => addBlock(section.id, page.id, "text")}
                          className="px-3 py-1 bg-white border-2 border-gray-300 hover:border-gray-400 rounded text-sm font-semibold transition-colors"
                        >
                          + Text
                        </button>
                        <button
                          onClick={() => addBlock(section.id, page.id, "input")}
                          className="px-3 py-1 bg-white border-2 border-gray-300 hover:border-gray-400 rounded text-sm font-semibold transition-colors"
                        >
                          + Input
                        </button>
                        <button
                          onClick={() => addBlock(section.id, page.id, "checkbox")}
                          className="px-3 py-1 bg-white border-2 border-gray-300 hover:border-gray-400 rounded text-sm font-semibold transition-colors"
                        >
                          + Checkbox
                        </button>
                        <button
                          onClick={() => addBlock(section.id, page.id, "image")}
                          className="px-3 py-1 bg-white border-2 border-gray-300 hover:border-gray-400 rounded text-sm font-semibold transition-colors"
                        >
                          + Image
                        </button>
                        <button
                          onClick={() => addBlock(section.id, page.id, "iframe")}
                          className="px-3 py-1 bg-white border-2 border-gray-300 hover:border-gray-400 rounded text-sm font-semibold transition-colors"
                        >
                          + iFrame
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {localWorkbook.sections.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No sections yet. Click "Add Section" to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <QRCodeModal
        workbookId={workbookId}
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
}
