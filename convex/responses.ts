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
    // console.log('[saveResponse] User ID:', userId); // Redundant log
    if (!userId) throw new Error("Not authenticated");

    const instance = await ctx.db.get(args.instanceId);
    // Debugging the mysterious "reset"
    console.log('[saveResponse] PRE-UPDATE Instance responses:', JSON.stringify(instance?.responses));

    if (!instance) throw new Error("Instance not found");

    // Verify client ownership
    if (instance.clientId !== userId) {
      console.error('[saveResponse] Authorization failed - clientId:', instance.clientId, 'userId:', userId);
      throw new Error("Not authorized");
    }

    // CRITICAL FIX: Never overwrite existing data with empty strings
    // This prevents race conditions from wiping user data during component re-mounts
    const existingValue = instance.responses[args.blockId];
    const isEmptyValue = args.value === "" || (Array.isArray(args.value) && args.value.length === 0);
    const hasExistingData = existingValue !== undefined && existingValue !== "" &&
      (!Array.isArray(existingValue) || existingValue.length > 0);
    
    if (isEmptyValue && hasExistingData) {
      console.log('[saveResponse] BLOCKED: Refusing to overwrite existing data with empty value');
      console.log('[saveResponse] Existing:', existingValue, '| Attempted:', args.value);
      return { success: true, blocked: true };
    }

    // Update responses object
    const updatedResponses = {
      ...instance.responses,
      [args.blockId]: args.value,
    };

    console.log('[saveResponse] POST-UPDATE (Planned) responses:', JSON.stringify(updatedResponses));

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
