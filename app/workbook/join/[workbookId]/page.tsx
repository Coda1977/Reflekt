"use client";

import { useEffect, useState, useRef } from "react";
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
  const [error, setError] = useState<string | null>(null);

  // Use refs to prevent infinite loops
  const hasStartedCreating = useRef(false);
  const hasStartedRedirect = useRef(false);

  useEffect(() => {
    console.log('[Join Page] Effect running - user:', user === undefined ? 'loading' : user === null ? 'not logged in' : 'logged in');

    // Still loading user
    if (user === undefined) {
      console.log('[Join Page] User still loading, waiting...');
      return;
    }

    // Not authenticated - redirect to login
    if (user === null) {
      if (hasStartedRedirect.current) {
        console.log('[Join Page] Already redirecting to login, skipping...');
        return;
      }

      console.log('[Join Page] User not authenticated, redirecting to login...');
      hasStartedRedirect.current = true;
      const redirectUrl = `/workbook/join/${workbookId}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // User is authenticated - get or create their instance
    if (hasStartedCreating.current) {
      console.log('[Join Page] Already started creating instance, skipping...');
      return;
    }

    console.log('[Join Page] User authenticated, getting/creating instance...');
    hasStartedCreating.current = true;

    const createInstance = async () => {
      try {
        console.log('[Join Page] Attempting to get or create instance for workbook:', workbookId);
        const instanceId = await getOrCreateInstance({ workbookId });
        console.log('[Join Page] Successfully created/got instance:', instanceId);
        router.push(`/workbook/${instanceId}`);
      } catch (err) {
        console.error("[Join Page] Failed to access workbook. Error:", err);
        console.error("[Join Page] Error message:", (err as Error).message);
        console.error("[Join Page] Error stack:", (err as Error).stack);
        setError("Failed to access workbook. Please try again.");
        hasStartedCreating.current = false; // Allow retry
      }
    };

    createInstance();
  }, [user, workbookId, router, getOrCreateInstance]);

  const handleRetry = () => {
    hasStartedCreating.current = false;
    setError(null);
    // Trigger re-render to retry
    window.location.reload();
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
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
