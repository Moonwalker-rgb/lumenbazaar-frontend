"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMotionPreference } from "./useMotionPreference";

export interface MotionContextValue {
  prefersReducedMotion: boolean;
  isHydrated: boolean;
  shouldReduceMotion: boolean;
  enableMotion: boolean;
}

const MotionContext = createContext<MotionContextValue | undefined>(undefined);

/**
 * Safe defaults for components rendered without a MotionProvider (e.g. isolated
 * unit tests). Motion is enabled, hydration has not occurred, and no reduced
 * motion preference has been detected.
 */
export const DEFAULT_MOTION_CONTEXT: MotionContextValue = {
  prefersReducedMotion: false,
  isHydrated: false,
  shouldReduceMotion: false,
  enableMotion: true
};

/**
 * MotionProvider wraps the application to provide motion preference context.
 * This allows child components to access the user's motion preference without
 * querying matchMedia directly, and ensures consistent state across the app.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const motionPreference = useMotionPreference();

  return <MotionContext.Provider value={motionPreference}>{children}</MotionContext.Provider>;
}

/**
 * Hook to access motion preference context in any component.
 * Components can use this to conditionally apply motion or render
 * alternative animations based on user preference.
 */
export function useMotion() {
  const context = useContext(MotionContext);
  if (context === undefined) {
    throw new Error("useMotion must be used within a MotionProvider");
  }
  return context;
}

/**
 * Hook to read motion context without throwing when no MotionProvider is
 * present. Consumers should fall back to DEFAULT_MOTION_CONTEXT when the
 * result is undefined.
 */
export function useOptionalMotion(): MotionContextValue | undefined {
  return useContext(MotionContext);
}
