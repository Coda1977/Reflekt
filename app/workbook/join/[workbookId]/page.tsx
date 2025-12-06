"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import { LoadingPage } from "@/components/ui/LoadingSpinner";

export default function JoinWorkbookPage() {
  const params = useParams();
  const router = useRouter();
  const workbookId = params.workbookId as Id<"workbooks">;

  const user = useQuery(api.users.getCurrentUser);
  const getOrCreateInstance = useMutation(api.workbookInstances.getOrCreateInstance);
  const [isCreating, setIsCreating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetOrCreateInstance = useCallback(async () => {
    if (isCreating) return; // Prevent duplicate calls

    setIsCreating(true);
    setError(null);

    try {
      console.log('[Join Page] Attempting to get or create instance for workbook:', workbookId);
      const instanceId = await getOrCreateInstance({ workbookId });
      console.log('[Join Page] Successfully created/got instance:', instanceId);
      // Redirect to the workbook instance
      router.push(`/workbook/${instanceId}`);
    } catch (err) {
      console.error("[Join Page] Failed to access workbook. Error:", err);
      console.error("[Join Page] Error message:", (err as Error).message);
      console.error("[Join Page] Error stack:", (err as Error).stack);
      setError("Failed to access workbook. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }, [workbookId, getOrCreateInstance, router, isCreating]);

  useEffect(() => {
    console.log('[Join Page] Effect running - user:', user === undefined ? 'loading' : user === null ? 'not logged in' : 'logged in');

    // Still loading user
    if (user === undefined) {
      console.log('[Join Page] User still loading, waiting...');
      return;
    }

    // Not authenticated - redirect to login
    if (user === null) {
      if (isRedirecting) {
        console.log('[Join Page] Already redirecting to login, skipping...');
        return;
      }

      console.log('[Join Page] User not authenticated, redirecting to login...');
      setIsRedirecting(true);
      const redirectUrl = `/workbook/join/${workbookId}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // User is authenticated - get or create their instance
    console.log('[Join Page] User authenticated, getting/creating instance...');
    handleGetOrCreateInstance();
  }, [user, workbookId, router, isRedirecting, handleGetOrCreateInstance]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleGetOrCreateInstance}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <LoadingPage />;
}
