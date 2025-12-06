import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

// Save or update response for a block
export const saveResponse = mutation({
  args: {
    instanceId: v.id("workbookInstances"),
    blockId: v.string(),
    value: v.union(v.string(), v.array(v.string())),
  },
  handler: async (ctx, args) => {
    console.log('[saveResponse] Starting save - blockId:', args.blockId, 'value:', args.value);

    const userId = await auth.getUserId(ctx);
    console.log('[saveResponse] User ID:', userId);
    if (!userId) throw new Error("Not authenticated");

    const instance = await ctx.db.get(args.instanceId);
    console.log('[saveResponse] Instance found:', !!instance, 'current responses:', instance?.responses);
    if (!instance) throw new Error("Instance not found");

    // Verify client ownership
    if (instance.clientId !== userId) {
      console.error('[saveResponse] Authorization failed - clientId:', instance.clientId, 'userId:', userId);
      throw new Error("Not authorized");
    }

    // Update responses object
    const updatedResponses = {
      ...instance.responses,
      [args.blockId]: args.value,
    };

    console.log('[saveResponse] Updating responses:', updatedResponses);

    await ctx.db.patch(args.instanceId, {
      responses: updatedResponses,
      lastUpdatedAt: Date.now(),
    });

    console.log('[saveResponse] Save successful!');
    return { success: true };
  },
});

// Mark workbook as completed
export const markCompleted = mutation({
  args: {
    instanceId: v.id("workbookInstances"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");

    // Verify client ownership
    if (instance.clientId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.instanceId, {
      completedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Clear response for a block
export const clearResponse = mutation({
  args: {
    instanceId: v.id("workbookInstances"),
    blockId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const instance = await ctx.db.get(args.instanceId);
    if (!instance) throw new Error("Instance not found");

    // Verify client ownership
    if (instance.clientId !== userId) {
      throw new Error("Not authorized");
    }

    // Remove block from responses
    const updatedResponses = { ...instance.responses };
    delete updatedResponses[args.blockId];

    await ctx.db.patch(args.instanceId, {
      responses: updatedResponses,
      lastUpdatedAt: Date.now(),
    });

    return { success: true };
  },
});
