/**
 * Timezone and Locale-Aware Datetime Formatter
 *
 * Provides user-customizable formatting for timestamps with:
 * - User-selected timezone display (IANA timezone IDs or UTC)
 * - User-selected locale for text formatting
 * - DST offset display for ambiguous times
 * - Always-available ISO 8601 values for verification and evidence
 *
 * Example:
 * - Input: "2024-11-19T14:30:45.123Z" with timezone "America/New_York", locale "en-US"
 * - Output: "Nov 19, 2024, 9:30:45 AM EST" (with DST info if applicable)
 * - ISO: "2024-11-19T14:30:45.123Z"
 */

/**
 * Represents formatted datetime output with multiple representations
 */
export type FormattedDateTime = {
  /** User-friendly formatted string (e.g., "Nov 19, 2024, 9:30:45 AM EST") */
  formatted: string;
  /** Timezone abbreviation or offset (e.g., "EST", "UTC-5") */
  tzDisplay: string;
  /** Full timezone name for clarity (e.g., "Eastern Standard Time") */
  tzName: string;
  /** UTC offset in hours (e.g., -5) for DST detection */
  tzOffsetHours: number;
  /** Original ISO 8601 string for verification and evidence */
  iso: string;
  /** Locale used for formatting */
  locale: string;
  /** Timezone ID used for formatting */
  timezone: string;
};

/**
 * Formatting options for datetime
 */
export type DateTimeFormatOptions = {
  /** IANA timezone ID (e.g., "America/New_York", "Europe/London", "UTC") */
  timezone: string;
  /** BCP 47 locale code (e.g., "en-US", "de-DE", "fr-FR") */
  locale: string;
  /** Include time in output */
  includeTime?: boolean;
  /** Include seconds in time output */
  includeSeconds?: boolean;
};

/**
 * Get all available IANA timezones
 * @returns Array of valid IANA timezone IDs
 */
export function getAvailableTimezones(): string[] {
  // All valid IANA timezone IDs supported by JavaScript Intl API
  return [
    "UTC",
    "America/Anchorage",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/New_York",
    "America/Toronto",
    "America/Vancouver",
    "America/Mexico_City",
    "America/Sao_Paulo",
    "America/Buenos_Aires",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Amsterdam",
    "Europe/Brussels",
    "Europe/Vienna",
    "Europe/Prague",
    "Europe/Warsaw",
    "Europe/Athens",
    "Europe/Istanbul",
    "Europe/Moscow",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Shanghai",
    "Asia/Hong_Kong",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Sydney",
    "Australia/Melbourne",
    "Australia/Perth",
    "Pacific/Auckland",
    "Pacific/Fiji"
  ];
}

/**
 * Get all available locales supported by Intl API
 * @returns Array of BCP 47 locale codes
 */
export function getAvailableLocales(): string[] {
  return [
    "en-US",
    "en-GB",
    "de-DE",
    "de-AT",
    "de-CH",
    "fr-FR",
    "fr-CA",
    "it-IT",
    "es-ES",
    "es-MX",
    "pt-BR",
    "pt-PT",
    "nl-NL",
    "nl-BE",
    "pl-PL",
    "ru-RU",
    "ja-JP",
    "zh-CN",
    "zh-TW",
    "ko-KR",
    "th-TH",
    "vi-VN",
    "id-ID",
    "tr-TR",
    "ar-SA",
    "he-IL",
    "sv-SE",
    "no-NO",
    "da-DK",
    "fi-FI",
    "el-GR",
    "cs-CZ",
    "hu-HU"
  ];
}

/**
 * Validate that a timezone ID is supported
 * @param timezone - IANA timezone ID to validate
 * @returns true if timezone is valid
 */
export function isValidTimezone(timezone: string): boolean {
  if (!timezone || (timezone !== "UTC" && !timezone.includes("/"))) {
    return false;
  }

  try {
    // Intl also accepts legacy abbreviations such as "EST"; only IANA-style
    // IDs (Area/Region, plus UTC) are exposed to users.
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate that a locale code is supported
 * @param locale - BCP 47 locale code to validate
 * @returns true if locale is valid
 */
export function isValidLocale(locale: string): boolean {
  if (!locale) {
    return false;
  }

  try {
    // Constructing a formatter with an unknown tag silently falls back to the
    // default locale, so use supportedLocalesOf to reject unsupported tags.
    return Intl.DateTimeFormat.supportedLocalesOf([locale]).length > 0;
  } catch {
    return false;
  }
}

/**
 * Get timezone abbreviation (e.g., "EST", "PST", "UTC+2")
 * @param date - Date to format
 * @param timezone - IANA timezone ID
 * @returns Timezone abbreviation string
 */
function getTimezoneAbbreviation(date: Date, timezone: string): string {
  if (timezone === "UTC") {
    return "UTC";
  }

  try {
    // Use Intl.DateTimeFormat to get timezone abbreviation
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short"
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get timezone name (e.g., "Eastern Standard Time")
 * @param date - Date to format
 * @param timezone - IANA timezone ID
 * @returns Full timezone name
 */
function getTimezoneName(date: Date, timezone: string): string {
  if (timezone === "UTC") {
    return "Coordinated Universal Time";
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "long"
    });

    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? timezone;
  } catch {
    return timezone;
  }
}

/**
 * Get UTC offset in hours for a timezone at a given date
 * Used to detect DST and provide offset info
 * @param date - Date to check
 * @param timezone - IANA timezone ID
 * @returns UTC offset in hours (e.g., -5 for EST, 1 for CET)
 */
function getTimezoneOffsetHours(date: Date, timezone: string): number {
  if (timezone === "UTC") {
    return 0;
  }

  try {
    // Get local time in target timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const getVal = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

    const year = getVal("year");
    const month = getVal("month");
    const day = getVal("day");
    const hour = getVal("hour");
    const minute = getVal("minute");
    const second = getVal("second");

    // Create local date in target timezone
    const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // Compare whole seconds: the source timestamp may carry milliseconds that
    // are intentionally omitted from the formatted parts.
    const utcTime = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    const offsetMs = utcTime - localDate.getTime();
    // Timezone offsets are whole minutes; round away any sub-minute noise.
    const offsetHours = Math.round(offsetMs / (1000 * 60)) / 60;

    return -offsetHours;
  } catch {
    return 0;
  }
}

/**
 * Format a timestamp (ISO 8601 string) with timezone and locale preferences
 *
 * @param timestamp - ISO 8601 string (e.g., "2024-11-19T14:30:45.123Z")
 * @param options - Formatting options with timezone and locale
 * @returns FormattedDateTime object with multiple representations
 * @throws Error if timestamp is invalid or options are invalid
 *
 * @example
 * const result = formatTimestamp("2024-11-19T14:30:45.123Z", {
 *   timezone: "America/New_York",
 *   locale: "en-US",
 *   includeTime: true,
 *   includeSeconds: true
 * });
 * // result: {
 * //   formatted: "Nov 19, 2024, 9:30:45 AM EST",
 * //   tzDisplay: "EST",
 * //   tzName: "Eastern Standard Time",
 * //   tzOffsetHours: -5,
 * //   iso: "2024-11-19T14:30:45.123Z",
 * //   locale: "en-US",
 * //   timezone: "America/New_York"
 * // }
 */
export function formatTimestamp(
  timestamp: string,
  options: DateTimeFormatOptions
): FormattedDateTime {
  // Validate timestamp is ISO 8601
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 timestamp: "${timestamp}"`);
  }

  // Validate timezone
  if (!isValidTimezone(options.timezone)) {
    throw new Error(`Invalid timezone: "${options.timezone}"`);
  }

  // Validate locale
  if (!isValidLocale(options.locale)) {
    throw new Error(`Invalid locale: "${options.locale}"`);
  }

  const includeTime = options.includeTime ?? true;
  const includeSeconds = options.includeSeconds ?? true;

  // Build formatter options
  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: options.timezone,
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: undefined
  };

  if (includeTime) {
    formatOptions.hour = "numeric";
    formatOptions.minute = "2-digit";
    if (includeSeconds) {
      formatOptions.second = "2-digit";
    }
    formatOptions.hour12 = options.locale.includes("en-") || options.locale.includes("pt-");
  }

  const formatter = new Intl.DateTimeFormat(options.locale, formatOptions);
  const formattedBase = formatter.format(date);

  // Get timezone abbreviation and name
  const tzDisplay = getTimezoneAbbreviation(date, options.timezone);
  const tzName = getTimezoneName(date, options.timezone);
  const tzOffsetHours = getTimezoneOffsetHours(date, options.timezone);

  // Combine formatted date/time with timezone
  const formatted = includeTime ? `${formattedBase} ${tzDisplay}` : formattedBase;

  return {
    formatted,
    iso: timestamp,
    locale: options.locale,
    timezone: options.timezone,
    tzDisplay,
    tzName,
    tzOffsetHours
  };
}

/**
 * Format a datetime using user preferences (convenience method)
 *
 * @param timestamp - ISO 8601 string
 * @param timezone - IANA timezone ID
 * @param locale - BCP 47 locale code
 * @param includeTime - Whether to include time (default: true)
 * @param includeSeconds - Whether to include seconds (default: true)
 * @returns Formatted string with timezone abbreviation
 *
 * @example
 * const dateStr = formatDateTime(
 *   "2024-11-19T14:30:45Z",
 *   "America/New_York",
 *   "en-US"
 * );
 * // "Nov 19, 2024, 9:30:45 AM EST"
 */
export function formatDateTime(
  timestamp: string,
  timezone: string,
  locale: string,
  includeTime = true,
  includeSeconds = true
): string {
  const formatted = formatTimestamp(timestamp, {
    timezone,
    locale,
    includeTime,
    includeSeconds
  });
  return formatted.formatted;
}

/**
 * Format a date only (no time) using user preferences
 *
 * @param timestamp - ISO 8601 string
 * @param timezone - IANA timezone ID
 * @param locale - BCP 47 locale code
 * @returns Formatted date string
 *
 * @example
 * const dateStr = formatDate(
 *   "2024-11-19T14:30:45Z",
 *   "America/New_York",
 *   "en-US"
 * );
 * // "Nov 19, 2024"
 */
export function formatDate(timestamp: string, timezone: string, locale: string): string {
  return formatDateTime(timestamp, timezone, locale, false, false);
}

/**
 * Format a time only using user preferences
 *
 * @param timestamp - ISO 8601 string
 * @param timezone - IANA timezone ID
 * @param locale - BCP 47 locale code
 * @param includeSeconds - Whether to include seconds (default: true)
 * @returns Formatted time string (e.g., "9:30:45 AM EST")
 *
 * @example
 * const timeStr = formatTime(
 *   "2024-11-19T14:30:45Z",
 *   "America/New_York",
 *   "en-US"
 * );
 * // "9:30:45 AM EST"
 */
export function formatTime(
  timestamp: string,
  timezone: string,
  locale: string,
  includeSeconds = true
): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ISO 8601 timestamp: "${timestamp}"`);
  }

  if (!isValidTimezone(timezone)) {
    throw new Error(`Invalid timezone: "${timezone}"`);
  }

  if (!isValidLocale(locale)) {
    throw new Error(`Invalid locale: "${locale}"`);
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: locale.includes("en-") || locale.includes("pt-")
  };

  if (includeSeconds) {
    formatOptions.second = "2-digit";
  }

  const formatter = new Intl.DateTimeFormat(locale, formatOptions);
  const formattedBase = formatter.format(date);

  const tzDisplay = getTimezoneAbbreviation(date, timezone);

  return `${formattedBase} ${tzDisplay}`;
}

/**
 * Get default timezone for user's system
 * @returns IANA timezone ID or "UTC" if detection fails
 */
export function getDefaultTimezone(): string {
  try {
    // Try to detect from browser/system timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && isValidTimezone(tz)) {
      return tz;
    }
  } catch {
    // Fall through to UTC
  }
  return "UTC";
}

/**
 * Get default locale for user's system
 * @returns BCP 47 locale code
 */
export function getDefaultLocale(): string {
  try {
    // Try to detect from browser/system locale
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (locale && isValidLocale(locale)) {
      return locale;
    }
  } catch {
    // Fall through to en-US
  }
  return "en-US";
}
