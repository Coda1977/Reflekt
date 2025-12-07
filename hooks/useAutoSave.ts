import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useAutoSave(
  instanceId: Id<"workbookInstances">,
  blockId: string,
  initialValue: string | string[]
) {
  // Use a ref to track if the user has EVER modified the value locally.
  // Once true, we ignore all external updates to prevent overwriting user work.
  const hasUserEdited = useRef(false);

  // Helper to compare values (handles arrays)
  const valuesAreEqual = (a: string | string[], b: string | string[]) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      return a.length === b.length && a.every((val, idx) => val === b[idx]);
    }
    return a === b;
  };

  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync with server ONLY if the user hasn't edited locally yet.
  // This handles the initial load where data might be delayed or updated by others
  // before the user starts typing.
  useEffect(() => {
    if (!hasUserEdited.current && !valuesAreEqual(value, initialValue)) {
      console.log('[useAutoSave] Syncing from server (no local edits):', initialValue);
      setValue(initialValue);
    }
  }, [initialValue]);

  // Wrapped setValue that marks the state as "dirty" (user owned)
  const setValueAndTrackChanges = useCallback((newValue: string | string[]) => {
    hasUserEdited.current = true;
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

      // CRITICAL CHANGE: Do NOT reset hasUserEdited.
      // We keep it true so that the inevitable "update" from the server 
      // (echoing back what we just saved) is ignored.

    } catch (err) {
      console.error("[useAutoSave] Failed to save response:", err);

      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`[useAutoSave] Retrying save (attempt ${retryCountRef.current}/${MAX_RETRIES})...`);
        const backoffDelay = Math.pow(2, retryCountRef.current - 1) * 1000;
        setTimeout(() => performSave(valueToSave), backoffDelay);
      } else {
        setError("Failed to save. Please check your connection.");
        retryCountRef.current = 0;
      }
    } finally {
      setSaving(false);
    }
  }, [instanceId, blockId, saveResponse]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // If no user edits, no need to save (unless we want to support "auto-save on initial load" which we don't)
    if (!hasUserEdited.current) return;

    setSaving(true);
    setError(null);

    timeoutRef.current = setTimeout(() => {
      performSave(value);
    }, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, performSave]);

  return {
    value,
    setValue: setValueAndTrackChanges,
    saving,
    error,
    lastSaved,
  };
}
