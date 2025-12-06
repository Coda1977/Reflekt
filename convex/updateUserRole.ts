import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

// Temporary mutation to update user role
export const updateCurrentUserRole = mutation({
  args: {
    role: v.union(v.literal("consultant"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    console.log('[updateUserRole] Starting, requested role:', args.role);

    const userId = await auth.getUserId(ctx);
    console.log('[updateUserRole] Got userId:', userId);

    if (!userId) {
      console.error('[updateUserRole] ERROR: Not authenticated - userId is null');
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    console.log('[updateUserRole] Current user:', user?.email, 'current role:', user?.role);

    await ctx.db.patch(userId, {
      role: args.role,
    });

    console.log('[updateUserRole] Successfully updated role to:', args.role);
    return { success: true };
  },
});

// Update user role by email (admin function)
export const updateUserRoleByEmail = mutation({
  args: {
    email: v.string(),
    role: v.union(v.literal("consultant"), v.literal("client")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      role: args.role,
    });

    return { success: true, userId: user._id };
  },
});
