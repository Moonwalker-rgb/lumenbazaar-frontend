import { useEffect, useRef, useCallback } from "react";

/**
 * useFocusRestoration: Manages focus restoration when an overlay closes.
 *
 * When a modal or overlay is opened, we capture the currently focused element.
 * When the overlay closes, focus is restored to that element (if still present).
 * This prevents focus from being lost to the document root.
 *
 * @param isOpen - Whether the overlay is currently open
 * @param onFocusRestored - Optional callback when focus is restored
 * @returns Object with methods to manage focus
 *
 * @example
 * const { markFocusTrigger, restoreFocus } = useFocusRestoration(isOpen);
 *
 * // In the trigger button
 * <button ref={markFocusTrigger}>Open modal</button>
 *
 * // When closing
 * const handleClose = () => {
 *   setIsOpen(false);
 *   restoreFocus();
 * };
 */
export function useFocusRestoration(isOpen: boolean, onFocusRestored?: () => void) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const markFocusTrigger = useCallback((element: HTMLElement | null) => {
    if (element) {
      previousFocusRef.current = element;
    }
  }, []);

  const restoreFocus = useCallback(() => {
    const previousElement = previousFocusRef.current;

    if (previousElement && document.body.contains(previousElement)) {
      // Element still exists in DOM
      previousElement.focus();
      onFocusRestored?.();
    }
  }, [onFocusRestored]);

  // Clear the saved focus when overlay opens to avoid stale references
  useEffect(() => {
    if (isOpen) {
      // Don't clear immediately; we'll clear when closing
      return;
    }
  }, [isOpen]);

  return { markFocusTrigger, restoreFocus };
}
