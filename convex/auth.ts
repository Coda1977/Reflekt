import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Get the role from params (passed from client signup)
      const role = ((args as any).params?.role as "consultant" | "client") || "client";

      // Check if user exists
      if (args.existingUserId) {
        // Update existing user with role if needed
        const user = await ctx.db.get(args.existingUserId);
        if (user && !user.role) {
          await ctx.db.patch(args.existingUserId, { role });
        }
        return args.existingUserId;
      }

      // Create new user with role
      const userId = await ctx.db.insert("users", {
        email: args.profile.email,
        role,
      });

      return userId;
    },
  },
});
