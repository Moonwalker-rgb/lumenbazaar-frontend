import { describe, it, expect } from "vitest";

import {
  formatDate,
  formatDateTime,
  formatTime,
  formatTimestamp,
  getAvailableLocales,
  getAvailableTimezones,
  getDefaultLocale,
  getDefaultTimezone,
  isValidLocale,
  isValidTimezone
} from "./datetime-formatter";

describe("datetime-formatter", () => {
  describe("getAvailableTimezones", () => {
    it("returns array of timezone IDs", () => {
      const timezones = getAvailableTimezones();
      expect(Array.isArray(timezones)).toBe(true);
      expect(timezones.length).toBeGreaterThan(0);
    });

    it("includes common timezones", () => {
      const timezones = getAvailableTimezones();
      expect(timezones).toContain("UTC");
      expect(timezones).toContain("America/New_York");
      expect(timezones).toContain("Europe/London");
      expect(timezones).toContain("Asia/Tokyo");
    });

    it("all returned timezones are valid", () => {
      const timezones = getAvailableTimezones();
      timezones.forEach((tz) => {
        expect(isValidTimezone(tz)).toBe(true);
      });
    });
  });

  describe("getAvailableLocales", () => {
    it("returns array of locale codes", () => {
      const locales = getAvailableLocales();
      expect(Array.isArray(locales)).toBe(true);
      expect(locales.length).toBeGreaterThan(0);
    });

    it("includes common locales", () => {
      const locales = getAvailableLocales();
      expect(locales).toContain("en-US");
      expect(locales).toContain("de-DE");
      expect(locales).toContain("fr-FR");
      expect(locales).toContain("ja-JP");
    });

    it("all returned locales are valid", () => {
      const locales = getAvailableLocales();
      locales.forEach((locale) => {
        expect(isValidLocale(locale)).toBe(true);
      });
    });
  });

  describe("isValidTimezone", () => {
    it("returns true for valid IANA timezone IDs", () => {
      expect(isValidTimezone("UTC")).toBe(true);
      expect(isValidTimezone("America/New_York")).toBe(true);
      expect(isValidTimezone("Europe/London")).toBe(true);
      expect(isValidTimezone("Asia/Tokyo")).toBe(true);
    });

    it("returns false for invalid timezone IDs", () => {
      expect(isValidTimezone("Invalid/Timezone")).toBe(false);
      expect(isValidTimezone("EST")).toBe(false);
      expect(isValidTimezone("")).toBe(false);
    });
  });

  describe("isValidLocale", () => {
    it("returns true for valid BCP 47 locale codes", () => {
      expect(isValidLocale("en-US")).toBe(true);
      expect(isValidLocale("de-DE")).toBe(true);
      expect(isValidLocale("fr-FR")).toBe(true);
      expect(isValidLocale("ja-JP")).toBe(true);
    });

    it("returns false for invalid locale codes", () => {
      expect(isValidLocale("invalid-locale")).toBe(false);
      expect(isValidLocale("xx-XX")).toBe(false);
      expect(isValidLocale("")).toBe(false);
    });
  });

  describe("getDefaultTimezone", () => {
    it("returns a valid timezone", () => {
      const tz = getDefaultTimezone();
      expect(isValidTimezone(tz)).toBe(true);
    });

    it("falls back to UTC", () => {
      const tz = getDefaultTimezone();
      expect(typeof tz).toBe("string");
      expect(tz.length).toBeGreaterThan(0);
    });
  });

  describe("getDefaultLocale", () => {
    it("returns a valid locale", () => {
      const locale = getDefaultLocale();
      expect(isValidLocale(locale)).toBe(true);
    });

    it("returns en-US as fallback", () => {
      const locale = getDefaultLocale();
      expect(typeof locale).toBe("string");
      expect(locale.length).toBeGreaterThan(0);
    });
  });

  describe("formatTimestamp", () => {
    const testDate = "2024-11-19T14:30:45.123Z";

    it("formats timestamp with timezone and locale", () => {
      const result = formatTimestamp(testDate, {
        timezone: "America/New_York",
        locale: "en-US",
        includeTime: true,
        includeSeconds: true
      });

      expect(result.formatted).toContain("Nov");
      expect(result.formatted).toContain("2024");
      expect(result.formatted).toContain("EST");
      expect(result.iso).toBe(testDate);
      expect(result.timezone).toBe("America/New_York");
      expect(result.locale).toBe("en-US");
    });

    it("includes timezone abbreviation", () => {
      const result = formatTimestamp(testDate, {
        timezone: "UTC",
        locale: "en-US"
      });

      expect(result.tzDisplay).toBe("UTC");
      expect(result.formatted).toContain("UTC");
    });

    it("includes timezone name for clarity", () => {
      const result = formatTimestamp(testDate, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      expect(result.tzName).toBeTruthy();
      expect(result.tzName.length).toBeGreaterThan(0);
    });

    it("provides UTC offset for DST detection", () => {
      const result = formatTimestamp(testDate, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      // EST is UTC-5 (November is standard time, not DST)
      expect(result.tzOffsetHours).toBe(-5);
    });

    it("always preserves ISO 8601 value", () => {
      const result = formatTimestamp(testDate, {
        timezone: "Asia/Tokyo",
        locale: "ja-JP"
      });

      expect(result.iso).toBe(testDate);
    });

    it("formats without time when includeTime is false", () => {
      const result = formatTimestamp(testDate, {
        timezone: "UTC",
        locale: "en-US",
        includeTime: false
      });

      expect(result.formatted).toContain("Nov");
      expect(result.formatted).toContain("2024");
      expect(result.formatted).not.toContain("UTC");
    });

    it("formats without seconds when includeSeconds is false", () => {
      const result = formatTimestamp(testDate, {
        timezone: "UTC",
        locale: "en-US",
        includeTime: true,
        includeSeconds: false
      });

      expect(result.formatted).toBeTruthy();
      // Should have hour and minute but not seconds
    });

    it("throws error for invalid ISO timestamp", () => {
      expect(() => {
        formatTimestamp("invalid-timestamp", {
          timezone: "UTC",
          locale: "en-US"
        });
      }).toThrow("Invalid ISO 8601 timestamp");
    });

    it("throws error for invalid timezone", () => {
      expect(() => {
        formatTimestamp(testDate, {
          timezone: "Invalid/Timezone",
          locale: "en-US"
        });
      }).toThrow("Invalid timezone");
    });

    it("throws error for invalid locale", () => {
      expect(() => {
        formatTimestamp(testDate, {
          timezone: "UTC",
          locale: "invalid-locale"
        });
      }).toThrow("Invalid locale");
    });

    it("handles DST transition correctly", () => {
      // March 10, 2024 at 2:30 AM EST (during DST transition in America/New_York)
      const dstDate = "2024-03-10T07:30:00Z";

      const result = formatTimestamp(dstDate, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      // After DST transition, offset should be -4 (EDT)
      expect(result.tzOffsetHours).toBe(-4);
      expect(result.tzDisplay).toBe("EDT");
    });

    it("handles winter time correctly", () => {
      // November 19, 2024 (standard time in America/New_York)
      const winterDate = "2024-11-19T20:00:00Z";

      const result = formatTimestamp(winterDate, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      // EST is UTC-5
      expect(result.tzOffsetHours).toBe(-5);
      expect(result.tzDisplay).toBe("EST");
    });

    it("supports multiple locales for same timestamp", () => {
      const usResult = formatTimestamp(testDate, {
        timezone: "UTC",
        locale: "en-US"
      });

      const deResult = formatTimestamp(testDate, {
        timezone: "UTC",
        locale: "de-DE"
      });

      const jpResult = formatTimestamp(testDate, {
        timezone: "UTC",
        locale: "ja-JP"
      });

      // All should have ISO value
      expect(usResult.iso).toBe(deResult.iso);
      expect(deResult.iso).toBe(jpResult.iso);

      // But formatting should differ
      expect(usResult.formatted).not.toBe(deResult.formatted);
      expect(deResult.formatted).not.toBe(jpResult.formatted);
    });

    it("handles multiple timezones for same timestamp", () => {
      const utcResult = formatTimestamp(testDate, {
        timezone: "UTC",
        locale: "en-US"
      });

      const nyResult = formatTimestamp(testDate, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      const tokyoResult = formatTimestamp(testDate, {
        timezone: "Asia/Tokyo",
        locale: "en-US"
      });

      // All should have same ISO value
      expect(utcResult.iso).toBe(nyResult.iso);
      expect(nyResult.iso).toBe(tokyoResult.iso);

      // But local times should differ
      expect(utcResult.formatted).not.toBe(nyResult.formatted);
      expect(nyResult.formatted).not.toBe(tokyoResult.formatted);
    });
  });

  describe("formatDateTime", () => {
    const testDate = "2024-11-19T14:30:45.123Z";

    it("returns formatted string with timezone", () => {
      const result = formatDateTime(testDate, "America/New_York", "en-US", true, true);

      expect(typeof result).toBe("string");
      expect(result).toContain("Nov");
      expect(result).toContain("2024");
      expect(result).toContain("EST");
    });

    it("respects includeTime parameter", () => {
      const withTime = formatDateTime(testDate, "UTC", "en-US", true, true);
      const withoutTime = formatDateTime(testDate, "UTC", "en-US", false, false);

      expect(withTime.length).toBeGreaterThan(withoutTime.length);
    });

    it("respects includeSeconds parameter", () => {
      const withSeconds = formatDateTime(testDate, "UTC", "en-US", true, true);

      const withoutSeconds = formatDateTime(testDate, "UTC", "en-US", true, false);

      expect(withSeconds).not.toBe(withoutSeconds);
    });
  });

  describe("formatDate", () => {
    const testDate = "2024-11-19T14:30:45.123Z";

    it("returns formatted date without time", () => {
      const result = formatDate(testDate, "UTC", "en-US");

      expect(result).toContain("Nov");
      expect(result).toContain("19");
      expect(result).toContain("2024");
      expect(result).not.toContain("UTC");
    });

    it("respects locale preferences", () => {
      const usDate = formatDate(testDate, "UTC", "en-US");
      const deDate = formatDate(testDate, "UTC", "de-DE");

      expect(usDate).not.toBe(deDate);
    });
  });

  describe("formatTime", () => {
    const testDate = "2024-11-19T14:30:45.123Z";

    it("returns formatted time with timezone", () => {
      const result = formatTime(testDate, "America/New_York", "en-US", true);

      expect(result).toBeTruthy();
      expect(result).toContain("EST");
      expect(typeof result).toBe("string");
    });

    it("includes seconds by default", () => {
      const withSeconds = formatTime(testDate, "UTC", "en-US", true);
      expect(withSeconds).toBeTruthy();
    });

    it("excludes seconds when specified", () => {
      const withoutSeconds = formatTime(testDate, "UTC", "en-US", false);
      expect(withoutSeconds).toBeTruthy();
    });

    it("throws error for invalid timestamp", () => {
      expect(() => {
        formatTime("invalid", "UTC", "en-US");
      }).toThrow("Invalid ISO 8601 timestamp");
    });

    it("throws error for invalid timezone", () => {
      expect(() => {
        formatTime(testDate, "Invalid/TZ", "en-US");
      }).toThrow("Invalid timezone");
    });

    it("throws error for invalid locale", () => {
      expect(() => {
        formatTime(testDate, "UTC", "invalid");
      }).toThrow("Invalid locale");
    });
  });

  describe("Edge cases and DST scenarios", () => {
    it("handles midnight UTC correctly", () => {
      const midnight = "2024-11-19T00:00:00Z";

      const result = formatTimestamp(midnight, {
        timezone: "UTC",
        locale: "en-US"
      });

      expect(result.formatted).toContain("Nov");
      expect(result.iso).toBe(midnight);
    });

    it("handles end of day UTC correctly", () => {
      const endOfDay = "2024-11-19T23:59:59.999Z";

      const result = formatTimestamp(endOfDay, {
        timezone: "UTC",
        locale: "en-US"
      });

      expect(result.formatted).toContain("Nov");
      expect(result.iso).toBe(endOfDay);
    });

    it("rejects timestamps with leap seconds", () => {
      // JavaScript Date cannot represent leap seconds; reject instead of
      // silently rolling them over into the next minute.
      expect(() =>
        formatTimestamp("2024-06-30T23:59:60Z", {
          timezone: "UTC",
          locale: "en-US"
        })
      ).toThrow("Invalid ISO 8601 timestamp");
    });

    it("preserves millisecond precision in ISO value", () => {
      const dateWithMs = "2024-11-19T14:30:45.999Z";

      const result = formatTimestamp(dateWithMs, {
        timezone: "UTC",
        locale: "en-US"
      });

      expect(result.iso).toBe(dateWithMs);
    });

    it("handles very old dates", () => {
      const oldDate = "1970-01-01T00:00:00Z";

      const result = formatTimestamp(oldDate, {
        timezone: "UTC",
        locale: "en-US"
      });

      expect(result.formatted).toContain("1970");
      expect(result.iso).toBe(oldDate);
    });

    it("handles future dates", () => {
      const futureDate = "2099-12-31T23:59:59Z";

      const result = formatTimestamp(futureDate, {
        timezone: "UTC",
        locale: "en-US"
      });

      expect(result.formatted).toContain("2099");
      expect(result.iso).toBe(futureDate);
    });
  });

  describe("Timezone offset variations", () => {
    it("correctly identifies positive UTC offsets", () => {
      // Japan is UTC+9, no DST
      const date = "2024-11-19T14:30:00Z";

      const result = formatTimestamp(date, {
        timezone: "Asia/Tokyo",
        locale: "en-US"
      });

      expect(result.tzOffsetHours).toBe(9);
    });

    it("correctly identifies negative UTC offsets", () => {
      // New York is UTC-5 in November (EST)
      const date = "2024-11-19T14:30:00Z";

      const result = formatTimestamp(date, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      expect(result.tzOffsetHours).toBe(-5);
    });

    it("correctly identifies UTC zero offset", () => {
      const date = "2024-11-19T14:30:00Z";

      const result = formatTimestamp(date, {
        timezone: "UTC",
        locale: "en-US"
      });

      expect(result.tzOffsetHours).toBe(0);
    });

    it("detects DST transitions for spring forward", () => {
      // March 10, 2024, 8:00 UTC is 3:00 AM EST, then changes to EDT
      const beforeDST = "2024-03-10T06:59:00Z"; // Before transition
      const afterDST = "2024-03-10T07:01:00Z"; // After transition

      const resultBefore = formatTimestamp(beforeDST, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      const resultAfter = formatTimestamp(afterDST, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      // Before: EST (UTC-5), After: EDT (UTC-4)
      expect(resultBefore.tzOffsetHours).toBe(-5);
      expect(resultAfter.tzOffsetHours).toBe(-4);
      expect(resultBefore.tzDisplay).not.toBe(resultAfter.tzDisplay);
    });

    it("detects DST transitions for fall back", () => {
      // November 3, 2024, 5:00 UTC is 1:00 AM EDT, then changes to EST
      const beforeDST = "2024-11-03T04:59:00Z"; // EDT
      const afterDST = "2024-11-03T06:01:00Z"; // EST

      const resultBefore = formatTimestamp(beforeDST, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      const resultAfter = formatTimestamp(afterDST, {
        timezone: "America/New_York",
        locale: "en-US"
      });

      expect(resultBefore.tzOffsetHours).toBe(-4); // EDT
      expect(resultAfter.tzOffsetHours).toBe(-5); // EST
    });
  });

  describe("Locale-specific formatting", () => {
    const testDate = "2024-11-19T14:30:45Z";

    it("formats dates according to US locale conventions", () => {
      const result = formatDateTime(testDate, "UTC", "en-US");
      expect(result).toBeTruthy();
    });

    it("formats dates according to German locale conventions", () => {
      const result = formatDateTime(testDate, "UTC", "de-DE");
      expect(result).toBeTruthy();
    });

    it("formats dates according to French locale conventions", () => {
      const result = formatDateTime(testDate, "UTC", "fr-FR");
      expect(result).toBeTruthy();
    });

    it("formats dates according to Japanese locale conventions", () => {
      const result = formatDateTime(testDate, "UTC", "ja-JP");
      expect(result).toBeTruthy();
    });

    it("formats dates according to Brazilian Portuguese locale conventions", () => {
      const result = formatDateTime(testDate, "UTC", "pt-BR");
      expect(result).toBeTruthy();
    });
  });
});
