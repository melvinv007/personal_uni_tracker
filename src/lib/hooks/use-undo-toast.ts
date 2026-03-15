import { useCallback } from "react";
import { showToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

interface UseUndoToastOptions {
  /** The item identifier being deleted */
  id: string;
  /** Name of the item/entity for the toast message (e.g. "Class") */
  entityName: string;
  /** The API path to hit for undo/hard delete (e.g. "/api/classes") */
  apiPath: string;
  /** The query keys to invalidate on undo success (e.g. ["classes"]) */
  invalidateKeys?: string[][];
  /** Optional callback after a successful undo */
  onUndoSuccess?: () => void;
  /** Optional callback if the undo fails */
  onUndoError?: (err: Error) => void;
  /** Optional callback if the hard delete fails */
  onHardDeleteError?: (err: Error) => void;
}

/**
 * A reusable hook to handle the "Soft Delete -> Undo Toast -> Hard Delete" workflow.
 * This should be called inside the `onSuccess` or `onSettled` of a soft-delete mutation.
 * 
 * Usage:
 * const { showUndoToast } = useUndoToast();
 * ...
 * onMutate: ...optimistic update...
 * onSuccess: (data, id) => {
 *   showUndoToast({
 *      id, 
 *      entityName: "Class", 
 *      apiPath: "/api/classes",
 *      invalidateKeys: [["classes"], ["semesters"]]
 *   });
 * }
 */
export function useUndoToast() {
  const queryClient = useQueryClient();

  const showUndoToast = useCallback(
    ({
      id,
      entityName,
      apiPath,
      invalidateKeys = [],
      onUndoSuccess,
      onUndoError,
      onHardDeleteError,
    }: UseUndoToastOptions) => {
      // Create an AbortController so we can cancel the hard delete if undone
      const abortController = new AbortController();
      let isUndone = false;

      // 1. Show the undo toast
      showToast(
        {
          message: `${entityName} deleted`,
          variant: "undo",
          duration: 5000,
          onUndo: async () => {
            isUndone = true;
            abortController.abort(); // Cancel the hard delete timeout

            try {
              // Trigger undo via API
              const res = await fetch(`${apiPath}/${id}?undo=true`, {
                method: "DELETE",
              });
              
              if (!res.ok) throw new Error(`Failed to undo ${entityName} deletion`);

              // Invalidate queries to fetch the item back
              invalidateKeys.forEach((key) => {
                queryClient.invalidateQueries({ queryKey: key });
              });

              showToast(`Restored ${entityName.toLowerCase()}`, "success");
              onUndoSuccess?.();
            } catch (err) {
              console.error(`Undo error for ${entityName}:`, err);
              showToast(`Failed to restore ${entityName.toLowerCase()}`, "error");
              if (err instanceof Error) onUndoError?.(err);
            }
          },
        }
      );

      // 2. Schedule the hard delete after 5 seconds if not undone
      setTimeout(async () => {
        if (isUndone) return; // Don't hard delete if the user clicked undo

        try {
          const res = await fetch(`${apiPath}/${id}?hard=true`, {
            method: "DELETE",
            signal: abortController.signal,
          });

          if (!res.ok && !abortController.signal.aborted) {
             console.error(`Failed to hard delete ${entityName}`);
             if (onHardDeleteError) onHardDeleteError(new Error("Hard delete failed"));
          }
        } catch (err) {
           // Ignore abort errors
           if (err instanceof Error && err.name === 'AbortError') return;
           console.error(`Hard delete error for ${entityName}:`, err);
           if (err instanceof Error && onHardDeleteError) onHardDeleteError(err);
        }
      }, 5000);
    },
    [queryClient]
  );

  return { showUndoToast };
}
