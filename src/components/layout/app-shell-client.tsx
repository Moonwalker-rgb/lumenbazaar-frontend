"use client";

import { Suspense } from "react";

import { useRouteChangeFocus } from "@/hooks/useRouteChangeFocus";

type AppShellClientProps = {
  children: React.ReactNode;
};

function RouteFocusManager() {
  useRouteChangeFocus();
  return null;
}

/**
 * AppShellClient: Client-side wrapper for AppShell that handles focus management.
 *
 * Manages focus restoration after route changes, ensuring keyboard and screen
 * reader users maintain focus on meaningful content. The hook reads search
 * params, so it is isolated in a Suspense boundary for static prerendering.
 */
export function AppShellClient({ children }: AppShellClientProps) {
  return (
    <>
      <Suspense fallback={null}>
        <RouteFocusManager />
      </Suspense>
      {children}
    </>
  );
}
