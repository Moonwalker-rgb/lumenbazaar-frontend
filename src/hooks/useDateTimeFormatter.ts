/**
 * Hook to access datetime formatting with user preferences
 * Returns formatting functions bound to the user's timezone and locale settings
 */

"use client";

import { useContext } from "react";

import { DateTimeFormatterContext } from "@/hooks/DateTimeFormatterProvider";

/**
 * Hook to access datetime formatting functions with user preferences
 * Must be used within a DateTimeFormatterProvider
 *
 * @returns DateTime formatter functions with timezone and locale applied
 * @throws Error if used outside of DateTimeFormatterProvider
 *
 * @example
 * const formatter = useDateTimeFormatter();
 * const formatted = formatter.formatDateTime("2024-11-19T14:30:45Z");
 */
export function useDateTimeFormatter() {
  const context = useContext(DateTimeFormatterContext);

  if (!context) {
    throw new Error("useDateTimeFormatter must be used within a DateTimeFormatterProvider");
  }

  return context;
}
