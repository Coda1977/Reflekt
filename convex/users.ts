import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get current user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    return await ctx.db.get(userId);
  },
});

// Get user by ID
export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Create consultant profile after signup
export const createConsultantProfile = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if profile already exists
    const existing = await ctx.db
      .query("consultantProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create with default branding
    const profileId = await ctx.db.insert("consultantProfiles", {
      userId: args.userId,
      branding: {
        primaryColor: "#003566",
        secondaryColor: "#FFD60A",
        fontFamily: "system-ui",
      },
      createdAt: Date.now(),
    });

    return profileId;
  },
});

// Get consultant profile
export const getConsultantProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("consultantProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Update consultant branding
export const updateBranding = mutation({
  args: {
    profileId: v.id("consultantProfiles"),
    branding: v.object({
      logoUrl: v.optional(v.string()),
      primaryColor: v.string(),
      secondaryColor: v.string(),
      fontFamily: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify ownership
    const profile = await ctx.db.get(args.profileId);
    if (!profile || profile.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.profileId, {
      branding: args.branding,
    });

    return args.profileId;
  },
});

// Get all clients (for consultant dashboard)
export const getAllClients = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get all unique client IDs from workbook instances created by this consultant
    const instances = await ctx.db
      .query("workbookInstances")
      .collect();

    // Get workbooks by this consultant
    const workbooks = await ctx.db
      .query("workbooks")
      .withIndex("by_consultant", (q) => q.eq("consultantId", userId))
      .collect();

    const workbookIds = new Set(workbooks.map((w) => w._id));

    // Filter instances to only those for this consultant's workbooks
    const consultantInstances = instances.filter(
      (i) => workbookIds.has(i.workbookId) && i.clientId
    );

    // Get unique client IDs
    const clientIds = new Set(
      consultantInstances.map((i) => i.clientId).filter(Boolean)
    );

    // Fetch client details
    const clients = await Promise.all(
      Array.from(clientIds).map((id) => ctx.db.get(id!))
    );

    return clients.filter(Boolean);
  },
});
