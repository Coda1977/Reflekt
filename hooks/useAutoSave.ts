import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useAutoSave(
  instanceId: Id<"workbookInstances">,
  blockId: string,
  initialValue: string | string[]
) {
  // Track if user has made local changes
  const hasLocalChanges = useRef(false);

  // Helper to compare values (handles arrays)
  const valuesAreEqual = (a: string | string[], b: string | string[]) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((val, idx) => val === b[idx]);
    }
    return a === b;
  };

  // SIMPLE APPROACH: Always use initialValue from Convex unless user has made changes
  const [value, setValue] = useState(initialValue);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // When initialValue changes from Convex and user hasn't made local changes, update the value
  useEffect(() => {
    if (!hasLocalChanges.current && !valuesAreEqual(value, initialValue)) {
      console.log('[useAutoSave] Loading saved value from Convex:', initialValue);
      setValue(initialValue);
    }
  }, [initialValue]);

  // Wrap setValue to track local changes
  const setValueAndTrackChanges = useCallback((newValue: string | string[]) => {
    hasLocalChanges.current = true;
    setValue(newValue);
  }, []);
  const saveResponse = useMutation(api.responses.saveResponse);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const performSave = useCallback(async (valueToSave: string | string[]) => {
    try {
      console.log('[useAutoSave] Saving to Convex:', valueToSave);
      await saveResponse({
        instanceId,
        blockId,
        value: valueToSave,
      });
      console.log('[useAutoSave] Save successful!');
      setLastSaved(new Date());
      setError(null);
      retryCountRef.current = 0;

      // Reset local changes flag after successful save
      // This allows Convex updates to flow through again
      hasLocalChanges.current = false;
    } catch (err) {
      console.error("[useAutoSave] Failed to save response:", err);

      // Retry logic for transient failures
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`[useAutoSave] Retrying save (attempt ${retryCountRef.current}/${MAX_RETRIES})...`);

        // Exponential backoff: 1s, 2s, 4s
        const backoffDelay = Math.pow(2, retryCountRef.current - 1) * 1000;

        setTimeout(() => {
          performSave(valueToSave);
        }, backoffDelay);
      } else {
        setError("Failed to save. Please check your connection.");
        retryCountRef.current = 0;
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

    // Only save if user has made local changes
    if (!hasLocalChanges.current) {
      return;
    }

    // Don't save if value equals what we loaded from Convex
    if (valuesAreEqual(value, initialValue)) {
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
  }, [value]);

  return {
    value,
    setValue: setValueAndTrackChanges,
    saving,
    error,
    lastSaved,
  };
}
