import { useEffect, useState } from "react";

/**
 * Hook to detect and track user's motion preference from system settings.
 * Safely handles hydration by using a two-phase initialization:
 * 1. Server render: returns default (reduced = false)
 * 2. Client useEffect: detects actual preference from matchMedia
 *
 * This prevents hydration mismatches where server and client render different values.
 */
export function useMotionPreference() {
  // Default to motion enabled (false = reduced motion is NOT preferred)
  // This ensures server and initial client render match
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Detect the actual system preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = true;

    // Defer state updates so the effect does not synchronously trigger a
    // cascading render, while keeping the server/client markup identical.
    queueMicrotask(() => {
      if (!active) return;
      setPrefersReducedMotion(mediaQuery.matches);
      setIsHydrated(true);
    });

    // Listen for changes to the preference (e.g., user changes system settings)
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Use addEventListener for broader browser support
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      active = false;
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return {
    prefersReducedMotion,
    isHydrated,
    shouldReduceMotion: prefersReducedMotion,
    // Convenience methods for conditional rendering
    enableMotion: !prefersReducedMotion
  };
}
