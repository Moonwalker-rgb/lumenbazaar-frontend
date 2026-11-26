import { z } from "zod";

/**
 * Column preference schema for managing table column visibility.
 * Stores which columns are visible for each table type.
 */

const columnPreferenceSchema = z.object({
  tableId: z.string().describe("Unique identifier for the table"),
  visibleColumns: z.array(z.string()).describe("List of visible column IDs"),
  requiredColumns: z.array(z.string()).describe("List of columns that cannot be hidden")
});

export type ColumnPreference = z.infer<typeof columnPreferenceSchema>;

const columnPreferencesSchema = z.record(z.string(), columnPreferenceSchema);

export type ColumnPreferences = z.infer<typeof columnPreferencesSchema>;

const storageKey = "lumenbazaar.frontend.column-preferences.v1";

type StorageLike = Pick<Storage, "getItem" | "removeItem" | "setItem">;

/**
 * Initialize default column preferences for a table.
 * All columns are visible by default.
 */
export function initializeColumnPreference(
  tableId: string,
  allColumnIds: string[],
  requiredColumns: string[]
): ColumnPreference {
  return {
    tableId,
    visibleColumns: allColumnIds,
    requiredColumns
  };
}

/**
 * Load all column preferences from storage.
 * Returns an empty object if storage is unavailable or contains no data.
 */
export function loadColumnPreferences(
  storage: StorageLike | undefined = browserStorage()
): ColumnPreferences {
  if (storage === undefined) {
    return {};
  }

  const raw = storage.getItem(storageKey);

  if (raw === null) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return columnPreferencesSchema.parse(parsed);
  } catch {
    return {};
  }
}

/**
 * Get column preference for a specific table.
 * Returns the saved preference or undefined if not found.
 */
export function getColumnPreference(
  tableId: string,
  storage: StorageLike | undefined = browserStorage()
): ColumnPreference | undefined {
  const preferences = loadColumnPreferences(storage);
  return preferences[tableId];
}

/**
 * Save or update column preference for a table.
 * Validates that at least all required columns remain visible.
 */
export function saveColumnPreference(
  preference: ColumnPreference,
  storage: StorageLike | undefined = browserStorage()
): ColumnPreference {
  // Validate that all required columns are visible
  const missingRequired = preference.requiredColumns.filter(
    (col) => !preference.visibleColumns.includes(col)
  );

  if (missingRequired.length > 0) {
    throw new Error(
      `Cannot hide required columns: ${missingRequired.join(", ")}. ` +
        `Required columns must always be visible.`
    );
  }

  const preferences = loadColumnPreferences(storage);
  const updated = { ...preferences, [preference.tableId]: preference };

  storage?.setItem(storageKey, JSON.stringify(updated));
  return preference;
}

/**
 * Reset column preferences to show all columns for a table.
 */
export function resetColumnPreference(
  tableId: string,
  allColumnIds: string[],
  requiredColumns: string[],
  storage: StorageLike | undefined = browserStorage()
): ColumnPreference {
  const preference = initializeColumnPreference(tableId, allColumnIds, requiredColumns);
  return saveColumnPreference(preference, storage);
}

/**
 * Delete all column preferences for a table.
 */
export function deleteColumnPreference(
  tableId: string,
  storage: StorageLike | undefined = browserStorage()
): void {
  const preferences = loadColumnPreferences(storage);
  delete preferences[tableId];
  storage?.setItem(storageKey, JSON.stringify(preferences));
}

/**
 * Get the set of visible columns for a table.
 * Returns all columns if no preference is saved.
 */
export function getVisibleColumns(
  tableId: string,
  allColumnIds: string[],
  storage: StorageLike | undefined = browserStorage()
): string[] {
  const preference = getColumnPreference(tableId, storage);
  if (!preference) {
    return allColumnIds;
  }

  // Filter to only include columns that still exist (in case schema changes)
  return preference.visibleColumns.filter((col) => allColumnIds.includes(col));
}

/**
 * Check if a column should be visible for a table.
 */
export function isColumnVisible(
  tableId: string,
  columnId: string,
  allColumnIds: string[],
  storage: StorageLike | undefined = browserStorage()
): boolean {
  const visibleColumns = getVisibleColumns(tableId, allColumnIds, storage);
  return visibleColumns.includes(columnId);
}

/**
 * Toggle visibility of a single column.
 * Prevents hiding required columns.
 */
export function toggleColumnVisibility(
  tableId: string,
  columnId: string,
  allColumnIds: string[],
  requiredColumns: string[],
  storage: StorageLike | undefined = browserStorage()
): ColumnPreference {
  if (requiredColumns.includes(columnId)) {
    throw new Error(`Cannot hide required column: ${columnId}`);
  }

  const preference =
    getColumnPreference(tableId, storage) ||
    initializeColumnPreference(tableId, allColumnIds, requiredColumns);

  const visibleColumns = preference.visibleColumns.includes(columnId)
    ? preference.visibleColumns.filter((col) => col !== columnId)
    : [...preference.visibleColumns, columnId];

  const updated = { ...preference, visibleColumns };
  return saveColumnPreference(updated, storage);
}

function browserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.localStorage;
}
