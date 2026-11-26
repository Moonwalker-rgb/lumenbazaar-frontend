import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { handleRouteChangeFocus } from "@/lib/focus-management";

/**
 * useRouteChangeFocus: Manages focus when the route changes in a Next.js app.
 *
 * When navigation occurs (detected via pathname/searchParams change),
 * focus is moved to the page heading without scrolling.
 * This improves accessibility for keyboard and screen reader users.
 *
 * @example
 * export default function RootLayout({ children }) {
 *   useRouteChangeFocus();
 *   return <>{children}</>;
 * }
 */
export function useRouteChangeFocus(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Combine pathname and search params to detect route changes
    const currentRoute = `${pathname}?${searchParams.toString()}`;
    handleRouteChangeFocus();
  }, [pathname, searchParams]);
}
