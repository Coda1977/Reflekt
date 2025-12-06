import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useAutoSave(
  instanceId: Id<"workbookInstances">,
  blockId: string,
  initialValue: string | string[]
) {
  // Use ref to store the initial value so it doesn't change on re-renders
  const initialValueRef = useRef(initialValue);
  const hasInitialized = useRef(false);
  const isFirstMount = useRef(true);

  // Helper to compare values (handles arrays)
  const valuesAreEqual = (a: string | string[], b: string | string[]) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((val, idx) => val === b[idx]);
    }
    return a === b;
  };

  // Initialize state
  const [value, setValue] = useState(() => {
    hasInitialized.current = true;
    return initialValue;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // CRITICAL: Update value when initialValue changes on first load
  // This handles the case where Convex returns cached empty data first,
  // then returns real data with saved responses
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return; // Skip on first mount (already initialized)
    }

    // Only update if:
    // 1. We're not currently saving (would overwrite user's typing)
    // 2. initialValue changed from what we stored
    // 3. Current value equals our old stored value (user hasn't typed anything new)
    // 4. New initialValue is NOT empty (don't overwrite with cached empty data)
    const hasContent = Array.isArray(initialValue) ? initialValue.length > 0 : initialValue !== "";

    if (
      !saving &&
      !valuesAreEqual(initialValue, initialValueRef.current) &&
      valuesAreEqual(value, initialValueRef.current) &&
      hasContent
    ) {
      console.log('[useAutoSave] Loading saved value:', initialValue);
      setValue(initialValue);
      initialValueRef.current = initialValue;
    }
  }, [initialValue, value, saving]);
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

      // CRITICAL: Update initialValueRef to the saved value
      // This prevents re-saving the same value when the component re-renders
      initialValueRef.current = valueToSave;
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
    if (valuesAreEqual(value, initialValueRef.current)) {
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
  }, [value]); // Only trigger on value changes, not initialValue

  return {
    value,
    setValue,
    saving,
    error,
    lastSaved,
  };
}
