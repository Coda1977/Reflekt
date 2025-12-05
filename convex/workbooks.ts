import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Block type definition for use in args
const blockType = v.union(
  v.object({
    type: v.literal("text"),
    id: v.string(),
    content: v.string(),
  }),
  v.object({
    type: v.literal("input"),
    id: v.string(),
    label: v.string(),
    placeholder: v.optional(v.string()),
    multiline: v.boolean(),
  }),
  v.object({
    type: v.literal("checkbox"),
    id: v.string(),
    label: v.string(),
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
      })
    ),
  }),
  v.object({
    type: v.literal("image"),
    id: v.string(),
    url: v.string(),
    alt: v.optional(v.string()),
  }),
  v.object({
    type: v.literal("iframe"),
    id: v.string(),
    url: v.string(),
    height: v.optional(v.string()),
  })
);

const pageType = v.object({
  id: v.string(),
  title: v.string(),
  blocks: v.array(blockType),
});

const sectionType = v.object({
  id: v.string(),
  title: v.string(),
  pages: v.array(pageType),
});

// Create new workbook
export const createWorkbook = mutation({
  args: {
    title: v.string(),
    sections: v.array(sectionType),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workbookId = await ctx.db.insert("workbooks", {
      consultantId: userId,
      title: args.title,
      sections: args.sections,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return workbookId;
  },
});

// Get all workbooks for current consultant
export const getWorkbooks = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db
      .query("workbooks")
      .withIndex("by_consultant", (q) => q.eq("consultantId", userId))
      .order("desc")
      .collect();
  },
});

// Get single workbook
export const getWorkbook = query({
  args: { workbookId: v.id("workbooks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workbook = await ctx.db.get(args.workbookId);
    if (!workbook) throw new Error("Workbook not found");

    // Verify ownership or client access
    // For now, only consultant can view
    if (workbook.consultantId !== userId) {
      throw new Error("Not authorized");
    }

    return workbook;
  },
});

// Update workbook
export const updateWorkbook = mutation({
  args: {
    workbookId: v.id("workbooks"),
    title: v.optional(v.string()),
    sections: v.optional(v.array(sectionType)),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workbook = await ctx.db.get(args.workbookId);
    if (!workbook) throw new Error("Workbook not found");
    if (workbook.consultantId !== userId) {
      throw new Error("Not authorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.sections !== undefined) updates.sections = args.sections;

    await ctx.db.patch(args.workbookId, updates);

    return args.workbookId;
  },
});

// Delete workbook
export const deleteWorkbook = mutation({
  args: { workbookId: v.id("workbooks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const workbook = await ctx.db.get(args.workbookId);
    if (!workbook) throw new Error("Workbook not found");
    if (workbook.consultantId !== userId) {
      throw new Error("Not authorized");
    }

    // Delete all instances
    const instances = await ctx.db
      .query("workbookInstances")
      .withIndex("by_workbook", (q) => q.eq("workbookId", args.workbookId))
      .collect();

    for (const instance of instances) {
      await ctx.db.delete(instance._id);
    }

    // Delete workbook
    await ctx.db.delete(args.workbookId);

    return { success: true };
  },
});

// Duplicate workbook
export const duplicateWorkbook = mutation({
  args: { workbookId: v.id("workbooks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const original = await ctx.db.get(args.workbookId);
    if (!original) throw new Error("Workbook not found");
    if (original.consultantId !== userId) {
      throw new Error("Not authorized");
    }

    const newWorkbookId = await ctx.db.insert("workbooks", {
      consultantId: userId,
      title: `${original.title} (Copy)`,
      sections: original.sections,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return newWorkbookId;
  },
});
