import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useAutoSave(
  instanceId: Id<"workbookInstances">,
  blockId: string,
  initialValue: string | string[]
) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveResponse = useMutation(api.responses.saveResponse);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const performSave = useCallback(async (valueToSave: string | string[]) => {
    try {
      await saveResponse({
        instanceId,
        blockId,
        value: valueToSave,
      });
      setLastSaved(new Date());
      setError(null);
      retryCountRef.current = 0; // Reset retry count on success
    } catch (err) {
      console.error("Failed to save response:", err);

      // Retry logic for transient failures
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`Retrying save (attempt ${retryCountRef.current}/${MAX_RETRIES})...`);

        // Exponential backoff: 1s, 2s, 4s
        const backoffDelay = Math.pow(2, retryCountRef.current - 1) * 1000;

        setTimeout(() => {
          performSave(valueToSave);
        }, backoffDelay);
      } else {
        setError("Failed to save. Please check your connection.");
        retryCountRef.current = 0; // Reset for next attempt
      }
    } finally {
      setSaving(false);
    }
  }, [instanceId, blockId, saveResponse]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't save if value hasn't changed from initial
    if (value === initialValue) {
      return;
    }

    // Set saving indicator immediately
    setSaving(true);
    setError(null);

    // Debounce save by 1 second
    timeoutRef.current = setTimeout(() => {
      performSave(value);
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, initialValue]); // Removed performSave to prevent infinite loop

  return {
    value,
    setValue,
    saving,
    error,
    lastSaved,
  };
}
