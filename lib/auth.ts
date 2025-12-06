"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export const useAuth = () => {
  const { signIn, signOut } = useAuthActions();
  const updateRole = useMutation(api.updateUserRole.updateCurrentUserRole);

  const signInWithPassword = async ({
    email,
    password,
    role,
  }: {
    email: string;
    password: string;
    role?: "consultant" | "client";
  }) => {
    try {
      await signIn("password", {
        email,
        password,
        flow: "signIn",
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign in failed",
      };
    }
  };

  const signUpWithPassword = async ({
    email,
    password,
    role = "client",
    name,
  }: {
    email: string;
    password: string;
    role?: "consultant" | "client";
    name?: string;
  }) => {
    try {
      console.log('[Auth Client] Starting signup for role:', role);

      // Sign up with Convex auth
      await signIn("password", {
        email,
        password,
        flow: "signUp",
      });

      console.log('[Auth Client] Signup completed, waiting for session...');

      // Wait for auth session to establish
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('[Auth Client] Updating role to:', role);

      // Update role after signup with retry logic
      let roleUpdateSuccess = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          console.log(`[Auth Client] Role update attempt ${attempt}/5`);
          await updateRole({ role });
          console.log('[Auth Client] Role updated successfully');
          roleUpdateSuccess = true;
          break;
        } catch (roleError) {
          console.error(`[Auth Client] Role update attempt ${attempt} failed:`, roleError);
          if (attempt < 5) {
            // Wait with exponential backoff: 500ms, 1000ms, 1500ms, 2000ms
            const waitTime = attempt * 500;
            console.log(`[Auth Client] Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      if (!roleUpdateSuccess) {
        console.warn('[Auth Client] WARNING: Failed to set role after 5 attempts');
        // Continue anyway - user is created and authenticated
      }

      console.log('[Auth Client] Signup flow completed');
      return { success: true };
    } catch (error) {
      console.error('[Auth Client] Signup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign up failed",
      };
    }
  };

  const logout = async () => {
    try {
      await signOut();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Sign out failed",
      };
    }
  };

  return {
    signInWithPassword,
    signUpWithPassword,
    logout,
  };
};
