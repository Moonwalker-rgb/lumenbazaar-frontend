/**
 * Focus management utilities for accessibility.
 *
 * Handles focus restoration after:
 * - Route/page transitions
 * - Modal/overlay closures
 * - Dynamic content changes
 */

/**
 * Finds a stable focus target for page navigation.
 * Looks for the first h1, then h2, or falls back to main.
 *
 * @param root - DOM node to search within (defaults to document)
 * @returns The found element or null
 */
export function findPageHeading(root: Document | Element = document): HTMLElement | null {
  // Try to find h1 first (most common for page titles)
  const h1 = root.querySelector("h1");
  if (h1) return h1 as HTMLElement;

  // Fall back to h2
  const h2 = root.querySelector("h2");
  if (h2) return h2 as HTMLElement;

  // Fall back to main element
  const main = root.querySelector("main");
  if (main) return main as HTMLElement;

  return null;
}

/**
 * Options for focusing an element safely.
 */
export interface FocusOptions {
  /**
   * Allow focus even if the element is already focused.
   * @default false
   */
  force?: boolean;

  /**
   * Prevent automatic scrolling to the focused element.
   * @default false
   */
  preventScroll?: boolean;

  /**
   * Element to focus. If not provided, searches for a heading.
   */
  target?: HTMLElement | null;
}

/**
 * Safely focuses an element without scrolling the page.
 * Returns true if focus was successfully applied.
 *
 * @param options - Focus options
 * @returns true if element was focused, false otherwise
 */
export function focusHeadingWithoutScroll(options: FocusOptions = {}): boolean {
  const { force = false, preventScroll = true, target } = options;

  const element = target || findPageHeading();

  if (!element) {
    return false;
  }

  // Skip if already focused and not forced
  if (!force && document.activeElement === element) {
    return false;
  }

  try {
    // Make focusable if needed
    if (element.getAttribute("tabindex") === null) {
      element.setAttribute("tabindex", "-1");
    }

    element.focus({ preventScroll });
    return true;
  } catch (error) {
    // Some elements might not support focus
    console.debug("Focus management error:", error);
    return false;
  }
}

/**
 * Restores focus to a previously saved element.
 * Used when closing overlays or dismissing dialogs.
 *
 * @param element - Element to focus
 * @param options - Focus options
 * @returns true if focus was restored, false otherwise
 */
export function restorePreviousFocus(
  element: HTMLElement | null,
  options: FocusOptions = {}
): boolean {
  if (!element) {
    return false;
  }

  if (!document.body.contains(element)) {
    // Element no longer in DOM
    return false;
  }

  try {
    element.focus(options);
    return true;
  } catch (error) {
    console.debug("Focus restoration error:", error);
    return false;
  }
}

/**
 * Manages focus for overlay/modal closing sequences.
 * Returns focus to the trigger element that opened the overlay.
 * If that element is unavailable, focuses the page heading.
 *
 * @param triggerElement - Element that triggered the overlay
 * @param options - Focus options
 * @returns true if focus was managed, false otherwise
 */
export function manageFocusAfterOverlay(
  triggerElement: HTMLElement | null,
  options: FocusOptions = {}
): boolean {
  // Try to restore focus to trigger element
  if (triggerElement && document.body.contains(triggerElement)) {
    return restorePreviousFocus(triggerElement, {
      ...options,
      preventScroll: options.preventScroll !== false
    });
  }

  // Fall back to page heading
  return focusHeadingWithoutScroll({
    ...options,
    preventScroll: options.preventScroll !== false
  });
}

/**
 * Handles focus when the page changes (route navigation).
 * Focuses a meaningful landmark without scrolling.
 *
 * @param options - Focus options
 * @returns true if focus was applied, false otherwise
 */
export function handleRouteChangeFocus(options: FocusOptions = {}): boolean {
  // Give the page time to render before focusing
  // (Next.js route changes are async)
  if (typeof window === "undefined") {
    return false;
  }

  // Use requestAnimationFrame to ensure DOM is updated
  let handled = false;
  requestAnimationFrame(() => {
    handled = focusHeadingWithoutScroll({
      ...options,
      preventScroll: options.preventScroll !== false,
      force: true
    });
  });

  return handled;
}
