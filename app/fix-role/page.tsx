"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FixRolePage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateMyRole = useMutation(api.updateUserRole.updateCurrentUserRole);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMakeConsultant = async () => {
    setLoading(true);
    setStatus("");
    try {
      await updateMyRole({ role: "consultant" });
      setStatus("✅ Successfully updated to consultant! Redirecting to admin...");
      setTimeout(() => {
        router.push("/admin");
      }, 1000);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setLoading(false);
    }
  };

  const handleMakeClient = async () => {
    setLoading(true);
    setStatus("");
    try {
      await updateMyRole({ role: "client" });
      setStatus("✅ Successfully updated to client! Redirecting to home...");
      setTimeout(() => {
        router.push("/home");
      }, 1000);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setLoading(false);
    }
  };

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (currentUser === null) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Not Logged In</h2>
          <p className="mb-4">Please log in first.</p>
          <Button onClick={() => router.push("/login")} variant="primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-4">Fix User Role</h1>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Current User Info</h2>
          <div className="space-y-2 mb-6">
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Current Role:</strong> <span className={!currentUser.role ? "text-red-600 font-bold" : ""}>{currentUser.role || "(no role set - THIS IS THE PROBLEM!)"}</span></p>
            <p className="text-sm text-gray-600"><strong>User ID:</strong> {currentUser._id}</p>
          </div>

          {!currentUser.role && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-semibold">⚠️ Your account doesn't have a role assigned!</p>
              <p className="text-red-700 text-sm mt-2">Click one of the buttons below to fix this.</p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              onClick={handleMakeConsultant}
              variant="primary"
              isLoading={loading}
              className="flex-1"
            >
              Make Me a Consultant
            </Button>

            <Button
              onClick={handleMakeClient}
              variant="secondary"
              isLoading={loading}
              className="flex-1"
            >
              Make Me a Client
            </Button>
          </div>

          {status && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              {status}
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="font-bold text-yellow-900 mb-2">Note:</h3>
          <p className="text-yellow-800 mb-2">
            This page is a temporary fix for accounts created before the role system was fully implemented.
          </p>
          <p className="text-yellow-800">
            <strong>For new accounts:</strong> Use <code className="bg-yellow-100 px-2 py-1 rounded">/signup?redirect=/admin</code> to automatically become a consultant.
          </p>
        </div>
      </div>
    </div>
  );
}
