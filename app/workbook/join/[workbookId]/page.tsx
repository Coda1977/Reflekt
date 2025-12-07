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
  const retryCount = useRef(0);

  useEffect(() => {
    // Still loading user
    if (user === undefined) return;

    // Not authenticated - redirect to login
    if (user === null) {
      if (hasStartedRedirect.current) return;
      hasStartedRedirect.current = true;
      const redirectUrl = `/workbook/join/${workbookId}`;
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    // Authenticated but waiting for role (sanity check)
    if (!user.role) return;

    // Ready to create instance
    if (hasStartedCreating.current) return;
    hasStartedCreating.current = true;

    const createInstance = async () => {
      try {
        console.log('[Join Page] Creating instance for workbook:', workbookId);
        const instanceId = await getOrCreateInstance({ workbookId });
        console.log('[Join Page] Success! Redirecting to:', instanceId);
        router.push(`/workbook/${instanceId}`);
      } catch (err: any) {
        console.error("[Join Page] Error creating instance:", err);

        // If specific auth error and we haven't retried too much, try again
        // This handles race conditions where client auth is ready but server context isn't
        if (retryCount.current < 3) {
          console.log(`[Join Page] Retrying... (${retryCount.current + 1}/3)`);
          retryCount.current++;
          hasStartedCreating.current = false; // Allow effect to run again
          setTimeout(() => {
            // Force re-execution by invalidating ref logic via state or just letting effect depend on something? 
            // Better: just call recursive or let the effect dependency array handle it if we reset the ref.
            // Since we reset hasStartedCreating.current = false, the next render/effect run will try again.
            // But we need to trigger a re-run. 
            // Actually, simply calling createInstance again recursively is safer here.
            createInstance();
          }, 1000 * retryCount.current); // Backoff: 1s, 2s, 3s
          return;
        }

        setError("Failed to access workbook. Please try again.");
        hasStartedCreating.current = false;
      }
    };

    createInstance();
  }, [user, workbookId, router, getOrCreateInstance]);

  const handleRetry = () => {
    hasStartedCreating.current = false;
    retryCount.current = 0;
    setError(null);
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
