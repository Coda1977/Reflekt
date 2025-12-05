import { useState, useEffect, useRef } from "react";
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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveResponse = useMutation(api.responses.saveResponse);
  const timeoutRef = useRef<NodeJS.Timeout>();

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

    // Debounce save by 1 second
    timeoutRef.current = setTimeout(async () => {
      try {
        await saveResponse({
          instanceId,
          blockId,
          value,
        });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save response:", error);
      } finally {
        setSaving(false);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, instanceId, blockId]);

  return {
    value,
    setValue,
    saving,
    lastSaved,
  };
}
