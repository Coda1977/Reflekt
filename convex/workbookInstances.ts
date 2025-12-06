import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Generate unique invite token
function generateInviteToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// Get instance by ID (for client access)
export const getInstance = query({
  args: { instanceId: v.id("workbookInstances") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    const instance = await ctx.db.get(args.instanceId);
    if (!instance) return null;

    // If user is authenticated, check if they're the client or consultant
    if (userId) {
      const workbook = await ctx.db.get(instance.workbookId);
      if (!workbook) return null;

      const isConsultant = workbook.consultantId === userId;
      const isClient = instance.clientId === userId;

      if (!isConsultant && !isClient) {
        return null;
      }
    }

    return instance;
  },
});

// Get or create instance for current user
// This allows one QR code to be used by multiple clients
export const getOrCreateInstance = mutation({
  args: {
    workbookId: v.id("workbooks"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if workbook exists
    const workbook = await ctx.db.get(args.workbookId);
    if (!workbook) throw new Error("Workbook not found");

    // Check if user already has an instance for this workbook
    const existingInstance = await ctx.db
      .query("workbookInstances")
      .withIndex("by_workbook", (q) => q.eq("workbookId", args.workbookId))
      .filter((q) => q.eq(q.field("clientId"), userId))
      .first();

    if (existingInstance) {
      return existingInstance._id;
    }

    // Create new instance for this user
    const instanceId = await ctx.db.insert("workbookInstances", {
      workbookId: args.workbookId,
      clientId: userId,
      inviteToken: generateInviteToken(),
      responses: {},
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    });

    return instanceId;
  },
});

// Get all instances for a client
export const getClientInstances = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const instances = await ctx.db
      .query("workbookInstances")
      .withIndex("by_client", (q) => q.eq("clientId", userId))
      .collect();

    // Fetch workbook details for each instance
    const instancesWithWorkbooks = await Promise.all(
      instances.map(async (instance) => {
        const workbook = await ctx.db.get(instance.workbookId);
        return {
          ...instance,
          workbook,
        };
      })
    );

    return instancesWithWorkbooks;
  },
});

// Get all instances for a workbook (consultant view)
export const getWorkbookInstances = query({
  args: { workbookId: v.id("workbooks") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify workbook ownership
    const workbook = await ctx.db.get(args.workbookId);
    if (!workbook) throw new Error("Workbook not found");
    if (workbook.consultantId !== userId) {
      throw new Error("Not authorized");
    }

    const instances = await ctx.db
      .query("workbookInstances")
      .withIndex("by_workbook", (q) => q.eq("workbookId", args.workbookId))
      .collect();

    // Fetch client details for each instance
    const instancesWithClients = await Promise.all(
      instances.map(async (instance) => {
        const client = instance.clientId
          ? await ctx.db.get(instance.clientId)
          : null;
        return {
          ...instance,
          client,
        };
      })
    );

    return instancesWithClients;
  },
});

// Get instance with full workbook data (for rendering)
// Optimized for concurrent access - batches database reads
export const getInstanceWithWorkbook = query({
  args: { instanceId: v.id("workbookInstances") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);

    const instance = await ctx.db.get(args.instanceId);
    if (!instance) return null;

    const workbook = await ctx.db.get(instance.workbookId);
    if (!workbook) return null;

    // Check authorization
    if (userId) {
      const isConsultant = workbook.consultantId === userId;
      const isClient = instance.clientId === userId;

      if (!isConsultant && !isClient) {
        return null;
      }
    }

    // Get consultant profile for branding (separate query for efficiency)
    const consultantProfile = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_user", (q) => q.eq("userId", workbook.consultantId))
      .first();

    return {
      instance,
      workbook,
      branding: consultantProfile?.branding,
    };
  },
});
