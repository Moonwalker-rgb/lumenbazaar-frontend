/**
 * Provider component that supplies datetime formatting functions
 * Uses user's timezone and locale preferences from settings
 */

"use client";

import { createContext, ReactNode, useMemo } from "react";

import {
  formatDate,
  formatDateTime,
  formatTime,
  formatTimestamp,
  type DateTimeFormatOptions,
  type FormattedDateTime
} from "@/lib/datetime-formatter";
import { loadFrontendSettings } from "@/services/settings";

/**
 * Formatter interface with all available formatting functions
 */
export type DateTimeFormatterContextType = {
  /** User's selected timezone ID */
  timezone: string;
  /** User's selected locale code */
  locale: string;
  /** Format a full datetime string */
  formatDateTime: (timestamp: string, includeSeconds?: boolean) => string;
  /** Format only the date */
  formatDate: (timestamp: string) => string;
  /** Format only the time */
  formatTime: (timestamp: string, includeSeconds?: boolean) => string;
  /** Format with full details including timezone info */
  formatTimestamp: (
    timestamp: string,
    options?: Partial<DateTimeFormatOptions>
  ) => FormattedDateTime;
};

/**
 * React Context for datetime formatting with user preferences
 * @internal Use useDateTimeFormatter hook instead of accessing directly
 */
export const DateTimeFormatterContext = createContext<DateTimeFormatterContextType | undefined>(
  undefined
);

/**
 * Provider component for datetime formatting with user preferences
 * Wraps the application or a subtree to provide timezone and locale-aware formatting
 *
 * @param children - React components to wrap
 * @returns Provider component
 *
 * @example
 * <DateTimeFormatterProvider>
 *   <YourApp />
 * </DateTimeFormatterProvider>
 */
export function DateTimeFormatterProvider({ children }: { children: ReactNode }) {
  const settings = useMemo(() => loadFrontendSettings(), []);

  const value: DateTimeFormatterContextType = useMemo(
    () => ({
      timezone: settings.timezoneId,
      locale: settings.localeCode,
      formatDateTime: (timestamp: string, includeSeconds = true) =>
        formatDateTime(timestamp, settings.timezoneId, settings.localeCode, true, includeSeconds),
      formatDate: (timestamp: string) =>
        formatDate(timestamp, settings.timezoneId, settings.localeCode),
      formatTime: (timestamp: string, includeSeconds = true) =>
        formatTime(timestamp, settings.timezoneId, settings.localeCode, includeSeconds),
      formatTimestamp: (timestamp: string, options?: Partial<DateTimeFormatOptions>) =>
        formatTimestamp(timestamp, {
          timezone: options?.timezone ?? settings.timezoneId,
          locale: options?.locale ?? settings.localeCode,
          includeTime: options?.includeTime ?? true,
          includeSeconds: options?.includeSeconds ?? true
        })
    }),
    [settings.timezoneId, settings.localeCode]
  );

  return (
    <DateTimeFormatterContext.Provider value={value}>{children}</DateTimeFormatterContext.Provider>
  );
}
