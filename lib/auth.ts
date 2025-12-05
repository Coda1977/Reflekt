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
      // First sign up
      const result = await signIn("password", {
        email,
        password,
        flow: "signUp",
      });

      // Wait a moment for auth to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then update the role
      await updateRole({ role });

      return { success: true };
    } catch (error) {
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
