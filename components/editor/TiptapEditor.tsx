"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import clsx from "clsx";

interface TiptapEditorProps {
  content: string; // JSON string
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  editable = true,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // Fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: content ? JSON.parse(content) : "",
    editable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        const json = editor.getJSON();
        onChange(JSON.stringify(json));
      }
    },
    editorProps: {
      attributes: {
        class: clsx(
          "prose prose-sm max-w-none focus:outline-none",
          editable && "min-h-[150px]",
          className
        ),
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content) {
      const currentContent = JSON.stringify(editor.getJSON());
      if (currentContent !== content) {
        try {
          editor.commands.setContent(JSON.parse(content));
        } catch (e) {
          // Invalid JSON, ignore
        }
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={clsx("tiptap-editor", !editable && "tiptap-readonly")}>
      {editable && (
        <div className="tiptap-menu border-b border-gray-200 pb-2 mb-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={clsx(
              "px-3 py-1 rounded text-sm font-semibold transition-colors",
              editor.isActive("bold")
                ? "bg-gray-900 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            Bold
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={clsx(
              "px-3 py-1 rounded text-sm font-semibold transition-colors",
              editor.isActive("italic")
                ? "bg-gray-900 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            Italic
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={clsx(
              "px-3 py-1 rounded text-sm font-semibold transition-colors",
              editor.isActive("heading", { level: 2 })
                ? "bg-gray-900 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={clsx(
              "px-3 py-1 rounded text-sm font-semibold transition-colors",
              editor.isActive("heading", { level: 3 })
                ? "bg-gray-900 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={clsx(
              "px-3 py-1 rounded text-sm font-semibold transition-colors",
              editor.isActive("bulletList")
                ? "bg-gray-900 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            Bullet List
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={clsx(
              "px-3 py-1 rounded text-sm font-semibold transition-colors",
              editor.isActive("orderedList")
                ? "bg-gray-900 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            )}
          >
            Numbered List
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

// Simplified read-only renderer for client view
export function TiptapRenderer({ content }: { content: string }) {
  return (
    <TiptapEditor
      content={content}
      editable={false}
      className="prose-gray"
    />
  );
}
