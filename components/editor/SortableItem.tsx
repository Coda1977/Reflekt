"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function SortableItem({ id, children, className = "" }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? "z-50" : ""}`}
      {...attributes}
    >
      <div className="relative group">
        {/* Drag Handle */}
        <div
          {...listeners}
          className="absolute -left-8 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
        >
          ⋮⋮
        </div>
        {children}
      </div>
    </div>
  );
}
