"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

export default function FixRolesPage() {
  const currentUser = useQuery(api.users.getCurrentUser);
  const updateMyRole = useMutation(api.updateUserRole.updateCurrentUserRole);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMakeConsultant = async () => {
    setLoading(true);
    setStatus("");
    try {
      await updateMyRole({ role: "consultant" });
      setStatus("✅ Successfully updated to consultant! Refresh the page.");
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMakeClient = async () => {
    setLoading(true);
    setStatus("");
    try {
      await updateMyRole({ role: "client" });
      setStatus("✅ Successfully updated to client! Refresh the page.");
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (currentUser === undefined) {
    return <div className="p-8">Loading...</div>;
  }

  if (currentUser === null) {
    return <div className="p-8">Not logged in</div>;
  }

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black mb-4">Fix User Role</h1>

        <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
          <h2 className="text-2xl font-bold mb-4">Current User Info</h2>
          <div className="space-y-2 mb-6">
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Current Role:</strong> {currentUser.role || "(no role set)"}</p>
            <p><strong>User ID:</strong> {currentUser._id}</p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleMakeConsultant}
              variant="primary"
              isLoading={loading}
            >
              Make Me a Consultant
            </Button>

            <Button
              onClick={handleMakeClient}
              variant="secondary"
              isLoading={loading}
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
          <p className="text-yellow-800">
            This page is a temporary fix for accounts created before the role system was implemented.
            New accounts created via <code className="bg-yellow-100 px-2 py-1 rounded">/signup?redirect=/admin</code> will automatically be consultants.
          </p>
        </div>
      </div>
    </div>
  );
}
