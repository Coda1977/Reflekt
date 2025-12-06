import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // Get the role from the args (passed from client signup)
      // The role comes directly on args when using Password provider
      const role = ((args as any).role as "consultant" | "client") || "client";

      console.log('[Auth] createOrUpdateUser called with role:', role);
      console.log('[Auth] existingUserId:', args.existingUserId);

      // Check if user exists
      if (args.existingUserId) {
        // Update existing user with role if needed
        const user = await ctx.db.get(args.existingUserId);
        console.log('[Auth] Existing user found:', !!user, 'has role:', user?.role);
        if (user && !user.role) {
          await ctx.db.patch(args.existingUserId, { role });
          console.log('[Auth] Updated existing user with role:', role);
        }
        return args.existingUserId;
      }

      // Create new user with role
      console.log('[Auth] Creating new user with email:', args.profile.email, 'role:', role);
      const userId = await ctx.db.insert("users", {
        email: args.profile.email,
        role,
      });

      console.log('[Auth] New user created with ID:', userId);
      return userId;
    },
  },
});
