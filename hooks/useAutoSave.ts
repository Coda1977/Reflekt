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
  const hasUserEdited = useRef(false);

  // Track if we have unsaved changes
  const isDirtyRef = useRef(false);

  // Keep track of latest value for unmount save
  const valueRef = useRef(initialValue);

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

  // Update valueRef whenever value changes so unmount effect sees it
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Sync with server ONLY if the user hasn't edited locally yet.
  useEffect(() => {
    if (!hasUserEdited.current && !valuesAreEqual(value, initialValue)) {
      console.log('[useAutoSave] Syncing from server (no local edits):', initialValue);
      setValue(initialValue);
      valueRef.current = initialValue;
    }
  }, [initialValue]);

  // Wrapped setValue that marks the state as "dirty"
  const setValueAndTrackChanges = useCallback((newValue: string | string[]) => {
    hasUserEdited.current = true;
    isDirtyRef.current = true;
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

      // CRITICAL FIX: Only mark as clean if the value we just saved 
      // is still the CURRENT value. If user typed more while we were saving,
      // we must keep isDirty=true so the next scheduled save fires.
      if (valuesAreEqual(valueToSave, valueRef.current)) {
        isDirtyRef.current = false;
      } else {
        console.log('[useAutoSave] Save finished, but new changes pending. Keeping isDirty=true.');
      }
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
      // We don't rely on `saving` state much logically, mostly for UI spinner.
      setSaving(false);
    }
  }, [instanceId, blockId, saveResponse]);

  // Debounced auto-save effect
  useEffect(() => {
    // Clear any pending save
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // If no user edits or not dirty, do nothing
    if (!hasUserEdited.current || !isDirtyRef.current) return;

    setSaving(true);
    setError(null);

    // Debounce for 500ms
    timeoutRef.current = setTimeout(() => {
      performSave(value);
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, performSave]);

  // SAVE ON UNMOUNT (Critical Fix)
  useEffect(() => {
    return () => {
      if (isDirtyRef.current) {
        console.log('[useAutoSave] Component unmounting with unsaved changes. Force saving:', valueRef.current);
        performSave(valueRef.current);
      }
    };
  }, [performSave]);

  return {
    value,
    setValue: setValueAndTrackChanges,
    saving,
    error,
    lastSaved,
  };
}
