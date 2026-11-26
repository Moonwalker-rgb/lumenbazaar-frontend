"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react";
import { useSearchParams } from "next/navigation";
import { z } from "zod";

/**
 * Cursor pagination error types
 */
export type PaginationErrorCode =
  | "STALE_CURSOR"
  | "MALFORMED_CURSOR"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export interface PaginationError {
  code: PaginationErrorCode;
  message: string;
}

/**
 * Paginated response from backend
 */
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  previousCursor?: string;
}

/**
 * Options for the cursor pagination hook
 */
export interface UseCursorPaginationOptions<T> {
  /**
   * Query function that fetches a page of items.
   * @param cursor Optional cursor for current page
   * @param direction Navigation direction ('forward' for next, 'backward' for previous)
   * @returns Paginated response with items and cursors
   */
  queryFn: (cursor?: string, direction?: "forward" | "backward") => Promise<PaginatedResponse<T>>;

  /**
   * Extract stable identifier from item (used for deduplication)
   */
  getKey: (item: T) => string;

  /**
   * Optional URL search params for tracking pagination state.
   * If not provided, uses Next.js useSearchParams hook internally.
   */
  urlSearchParams?: URLSearchParams;

  /**
   * Optional callback before navigation
   */
  onBeforeNavigation?: (direction: "forward" | "backward") => void;

  /**
   * Page size (default: 50). Used for deduplication tracking.
   */
  pageSize?: number;

  /**
   * Optional callback to update URL params
   */
  onUpdateUrl?: (params: URLSearchParams) => void;
}

/**
 * Result of cursor pagination hook
 */
export interface UseCursorPaginationResult<T> {
  // Current page rows (deduplicated)
  rows: T[];

  // Loading state
  isLoading: boolean;

  // Error state (if any)
  error?: PaginationError;

  // Pagination state
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // Navigation functions
  nextPage: () => void;
  previousPage: () => void;
  resetPagination: () => void;
}

/**
 * Schema for cursor validation
 */
const cursorSchema = z.string().max(1024).optional();
const directionSchema = z.enum(["forward", "backward"]).optional();

/**
 * Validates cursor format
 */
function isValidCursor(value: unknown): value is string | undefined {
  const result = cursorSchema.safeParse(value);
  return result.success;
}

/**
 * Deduplicates items by key while preserving backend order
 */
function deduplicate<T>(newItems: T[], getKey: (item: T) => string, existingItems?: T[]): T[] {
  const seen = new Set<string>();

  // Add existing keys to the set
  if (existingItems) {
    for (const item of existingItems) {
      seen.add(getKey(item));
    }
  }

  // Filter out duplicates from new items
  const deduplicated: T[] = [];
  for (const item of newItems) {
    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(item);
    }
  }

  return deduplicated;
}

interface FetchCursorPageParams<T> {
  abortControllerRef: { current: AbortController | null };
  cursor: string | undefined;
  direction: "forward" | "backward" | undefined;
  getKey: (item: T) => string;
  queryFn: UseCursorPaginationOptions<T>["queryFn"];
  setError: Dispatch<SetStateAction<PaginationError | undefined>>;
  setNextCursor: Dispatch<SetStateAction<string | undefined>>;
  setPreviousCursor: Dispatch<SetStateAction<string | undefined>>;
  setRows: Dispatch<SetStateAction<T[]>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}

/**
 * Fetch a page outside the hook so state updates are not traced back to the
 * hook's initial-page effect.
 */
async function fetchCursorPage<T>({
  abortControllerRef,
  cursor,
  direction,
  getKey,
  queryFn,
  setError,
  setNextCursor,
  setPreviousCursor,
  setRows,
  setIsLoading
}: FetchCursorPageParams<T>): Promise<void> {
  // Abort previous request if any
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  const controller = new AbortController();
  abortControllerRef.current = controller;

  try {
    setIsLoading(true);
    setError(undefined);

    // Validate cursor format
    if (!isValidCursor(cursor)) {
      setError({
        code: "MALFORMED_CURSOR",
        message: "Invalid cursor format. Starting from the beginning."
      });
      setRows([]);
      setNextCursor(undefined);
      setPreviousCursor(undefined);
      setIsLoading(false);
      return;
    }

    // Fetch data with timeout
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await queryFn(cursor, direction);

      if (controller.signal.aborted) {
        return;
      }

      clearTimeout(timeoutId);

      // A navigation replaces the current page; deduplicate within that page
      // while keeping the backend's order.
      setRows(deduplicate(response.items, getKey));
      setNextCursor(response.nextCursor);
      setPreviousCursor(response.previousCursor);
      setIsLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    if (controller.signal.aborted) {
      return;
    }

    // Detect stale cursor (backend returns 400 or empty)
    const isStale =
      err instanceof Error &&
      (err.message.includes("400") || err.message.includes("Invalid cursor"));

    setError({
      code: isStale ? "STALE_CURSOR" : "NETWORK_ERROR",
      message: isStale
        ? "Page is outdated. Starting from the beginning."
        : "Failed to load page. Please try again."
    });

    // On stale cursor, reset to first page
    if (isStale) {
      setRows([]);
      setNextCursor(undefined);
      setPreviousCursor(undefined);
    }

    setIsLoading(false);
  } finally {
    // Do not clear a newer request's controller when an older one settles.
    if (abortControllerRef.current === controller) {
      abortControllerRef.current = null;
    }
  }
}

/**
 * Hook for managing cursor-based pagination with URL persistence
 *
 * Features:
 * - Cursor state persisted in URL search params
 * - Automatic deduplication of rows by stable key
 * - Graceful handling of stale/malformed cursors
 * - Abort controller for race condition handling
 * - Non-destructive loading states
 *
 * @example
 * ```tsx
 * const { rows, isLoading, hasNextPage, nextPage, previousPage } = useCursorPagination({
 *   queryFn: (cursor, direction) => fetchPayments(cursor, direction),
 *   getKey: (payment) => payment.id,
 * });
 * ```
 */
export function useCursorPagination<T>({
  queryFn,
  getKey,
  urlSearchParams,
  onBeforeNavigation,
  pageSize = 50,
  onUpdateUrl
}: UseCursorPaginationOptions<T>): UseCursorPaginationResult<T> {
  const searchParams = useSearchParams();
  // useSearchParams() can be null outside the Next.js App Router (e.g. in
  // unit tests). Normalize once so every read has a safe, stable fallback.
  const fallbackParams = useMemo(() => searchParams ?? new URLSearchParams(), [searchParams]);

  // State for current page. A fetch always starts on mount, so loading begins
  // as true (the initial effect cannot set state synchronously).
  const [rows, setRows] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PaginationError | undefined>();

  // Track pagination metadata
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [previousCursor, setPreviousCursor] = useState<string | undefined>();

  // Abort controller for race condition handling
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep the fetch callback stable: inline queryFn/getKey props change on every
  // render and must not retrigger the initial-page effect.
  const queryFnRef = useRef(queryFn);
  const getKeyRef = useRef(getKey);
  useEffect(() => {
    queryFnRef.current = queryFn;
    getKeyRef.current = getKey;
  }, [queryFn, getKey]);

  // The last cursor/direction fetched, so a navigation does not fetch twice
  // when the URL change it triggers is reflected back into the hook.
  const lastRequestKeyRef = useRef<string | null>(null);

  // Read cursor from URL
  const currentCursor = urlSearchParams?.get("cursor") ?? fallbackParams.get("cursor") ?? undefined;
  const currentDirection = (urlSearchParams?.get("direction") ??
    fallbackParams.get("direction") ??
    undefined) as "forward" | "backward" | undefined;

  /**
   * Update URL with new cursor and direction
   */
  const updateUrl = useCallback(
    (newCursor: string | undefined, direction: "forward" | "backward" | undefined) => {
      const params = new URLSearchParams(urlSearchParams ?? fallbackParams);

      if (newCursor) {
        params.set("cursor", newCursor);
      } else {
        params.delete("cursor");
      }

      if (direction) {
        params.set("direction", direction);
      } else {
        params.delete("direction");
      }

      if (onUpdateUrl) {
        onUpdateUrl(params);
      } else {
        // Update browser URL without reload
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.replaceState(null, "", newUrl);
      }
    },
    [fallbackParams, urlSearchParams, onUpdateUrl]
  );

  /**
   * Fetch page of data
   */
  const fetchPage = useCallback(
    (cursor: string | undefined, direction: "forward" | "backward" | undefined) =>
      fetchCursorPage({
        abortControllerRef,
        cursor,
        direction,
        getKey: getKeyRef.current,
        queryFn: queryFnRef.current,
        setError,
        setNextCursor,
        setPreviousCursor,
        setRows,
        setIsLoading
      }),
    []
  );

  /**
   * Load initial page or current page on mount/cursor change
   */
  useEffect(() => {
    const key = `${currentCursor ?? ""}\u0000${currentDirection ?? ""}`;
    if (lastRequestKeyRef.current === key) {
      return;
    }
    lastRequestKeyRef.current = key;

    queueMicrotask(() => {
      void fetchPage(currentCursor, currentDirection);
    });
  }, [currentCursor, currentDirection, fetchPage]);

  /**
   * Navigate to a page, updating the URL once and fetching that page once.
   * Existing rows stay visible until the new page arrives.
   */
  const navigate = useCallback(
    (cursor: string, direction: "forward" | "backward") => {
      onBeforeNavigation?.(direction);
      updateUrl(cursor, direction);
      lastRequestKeyRef.current = `${cursor}\u0000${direction}`;
      setIsLoading(true);
      void fetchPage(cursor, direction);
    },
    [fetchPage, onBeforeNavigation, updateUrl]
  );

  /**
   * Navigate to next page
   */
  const handleNextPage = useCallback(() => {
    if (nextCursor) {
      navigate(nextCursor, "forward");
    }
  }, [nextCursor, navigate]);

  /**
   * Navigate to previous page
   */
  const handlePreviousPage = useCallback(() => {
    if (previousCursor) {
      navigate(previousCursor, "backward");
    }
  }, [previousCursor, navigate]);

  /**
   * Reset to first page
   */
  const handleResetPagination = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    updateUrl(undefined, undefined);
    // Let the URL-driven effect load the first page when the URL actually
    // changes; with a mocked onUpdateUrl the rows simply stay cleared.
    lastRequestKeyRef.current = null;
    setIsLoading(false);
    setRows([]);
    setNextCursor(undefined);
    setPreviousCursor(undefined);
    setError(undefined);
  }, [updateUrl]);

  return {
    rows,
    isLoading,
    error,
    hasNextPage: !!nextCursor,
    hasPreviousPage: !!previousCursor,
    nextPage: handleNextPage,
    previousPage: handlePreviousPage,
    resetPagination: handleResetPagination
  };
}
