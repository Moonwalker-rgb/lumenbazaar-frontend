import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  initializeColumnPreference,
  loadColumnPreferences,
  getColumnPreference,
  saveColumnPreference,
  resetColumnPreference,
  deleteColumnPreference,
  getVisibleColumns,
  isColumnVisible,
  toggleColumnVisibility,
  type ColumnPreference
} from "./column-preferences";

describe("column-preferences", () => {
  const mockStorage = (): Storage => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      key: (index: number) => Object.keys(store)[index] ?? null,
      length: Object.keys(store).length
    };
  };

  describe("initializeColumnPreference", () => {
    it("creates a preference with all columns visible", () => {
      const columns = ["id", "name", "status", "date"];
      const required = ["id"];

      const preference = initializeColumnPreference("test-table", columns, required);

      expect(preference).toEqual({
        tableId: "test-table",
        visibleColumns: columns,
        requiredColumns: required
      });
    });
  });

  describe("loadColumnPreferences", () => {
    it("returns empty object when storage is undefined", () => {
      const prefs = loadColumnPreferences(undefined);
      expect(prefs).toEqual({});
    });

    it("returns empty object when storage has no data", () => {
      const storage = mockStorage();
      const prefs = loadColumnPreferences(storage);
      expect(prefs).toEqual({});
    });

    it("loads and parses preferences from storage", () => {
      const storage = mockStorage();
      const testData = {
        "table-1": {
          tableId: "table-1",
          visibleColumns: ["id", "name"],
          requiredColumns: ["id"]
        }
      };

      storage.setItem("lumenbazaar.frontend.column-preferences.v1", JSON.stringify(testData));
      const prefs = loadColumnPreferences(storage);

      expect(prefs).toEqual(testData);
    });

    it("returns empty object on invalid JSON", () => {
      const storage = mockStorage();
      storage.setItem("lumenbazaar.frontend.column-preferences.v1", "invalid json");

      const prefs = loadColumnPreferences(storage);
      expect(prefs).toEqual({});
    });
  });

  describe("getColumnPreference", () => {
    it("returns undefined when preference not found", () => {
      const storage = mockStorage();
      const pref = getColumnPreference("missing-table", storage);
      expect(pref).toBeUndefined();
    });

    it("returns preference when it exists", () => {
      const storage = mockStorage();
      const testPref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: ["id"]
      };

      storage.setItem(
        "lumenbazaar.frontend.column-preferences.v1",
        JSON.stringify({ "table-1": testPref })
      );

      const pref = getColumnPreference("table-1", storage);
      expect(pref).toEqual(testPref);
    });
  });

  describe("saveColumnPreference", () => {
    it("saves a new preference", () => {
      const storage = mockStorage();
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: ["id"]
      };

      saveColumnPreference(pref, storage);
      const loaded = getColumnPreference("table-1", storage);

      expect(loaded).toEqual(pref);
    });

    it("updates an existing preference", () => {
      const storage = mockStorage();
      const pref1: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: ["id"]
      };

      saveColumnPreference(pref1, storage);

      const pref2: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name", "status"],
        requiredColumns: ["id"]
      };

      saveColumnPreference(pref2, storage);
      const loaded = getColumnPreference("table-1", storage);

      expect(loaded).toEqual(pref2);
    });

    it("throws error if required column is hidden", () => {
      const storage = mockStorage();
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["name", "status"],
        requiredColumns: ["id"] // 'id' is required but not visible
      };

      expect(() => saveColumnPreference(pref, storage)).toThrow(/Cannot hide required columns/);
    });

    it("allows hiding non-required columns", () => {
      const storage = mockStorage();
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"], // 'status' is hidden
        requiredColumns: ["id", "name"]
      };

      expect(() => saveColumnPreference(pref, storage)).not.toThrow();
    });
  });

  describe("resetColumnPreference", () => {
    it("resets to show all columns", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status", "date"];
      const required = ["id"];

      // First, hide some columns
      const hidden: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: required
      };
      saveColumnPreference(hidden, storage);

      // Reset
      resetColumnPreference("table-1", columns, required, storage);
      const pref = getColumnPreference("table-1", storage);

      expect(pref?.visibleColumns).toEqual(columns);
    });
  });

  describe("deleteColumnPreference", () => {
    it("removes preference from storage", () => {
      const storage = mockStorage();
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: ["id"]
      };

      saveColumnPreference(pref, storage);
      deleteColumnPreference("table-1", storage);

      const loaded = getColumnPreference("table-1", storage);
      expect(loaded).toBeUndefined();
    });
  });

  describe("getVisibleColumns", () => {
    it("returns all columns when no preference exists", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status"];

      const visible = getVisibleColumns("table-1", columns, storage);
      expect(visible).toEqual(columns);
    });

    it("returns saved visible columns", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status", "date"];
      const required = ["id"];
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: required
      };

      saveColumnPreference(pref, storage);
      const visible = getVisibleColumns("table-1", columns, storage);

      expect(visible).toEqual(["id", "name"]);
    });

    it("filters out columns that no longer exist", () => {
      const storage = mockStorage();
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name", "oldColumn"],
        requiredColumns: ["id"]
      };

      storage.setItem(
        "lumenbazaar.frontend.column-preferences.v1",
        JSON.stringify({ "table-1": pref })
      );

      const currentColumns = ["id", "name", "status"];
      const visible = getVisibleColumns("table-1", currentColumns, storage);

      expect(visible).toEqual(["id", "name"]);
    });
  });

  describe("isColumnVisible", () => {
    it("returns true for visible columns", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status"];
      const required = ["id"];
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: required
      };

      saveColumnPreference(pref, storage);
      expect(isColumnVisible("table-1", "id", columns, storage)).toBe(true);
      expect(isColumnVisible("table-1", "name", columns, storage)).toBe(true);
    });

    it("returns false for hidden columns", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status"];
      const required = ["id"];
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: required
      };

      saveColumnPreference(pref, storage);
      expect(isColumnVisible("table-1", "status", columns, storage)).toBe(false);
    });
  });

  describe("toggleColumnVisibility", () => {
    it("hides a visible column", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status"];
      const required = ["id"];

      saveColumnPreference(initializeColumnPreference("table-1", columns, required), storage);

      const updated = toggleColumnVisibility("table-1", "status", columns, required, storage);

      expect(updated.visibleColumns).toEqual(["id", "name"]);
    });

    it("shows a hidden column", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status"];
      const required = ["id"];
      const pref: ColumnPreference = {
        tableId: "table-1",
        visibleColumns: ["id", "name"],
        requiredColumns: required
      };

      saveColumnPreference(pref, storage);

      const updated = toggleColumnVisibility("table-1", "status", columns, required, storage);

      expect(updated.visibleColumns).toEqual(["id", "name", "status"]);
    });

    it("throws error when toggling required column", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status"];
      const required = ["id"];

      saveColumnPreference(initializeColumnPreference("table-1", columns, required), storage);

      expect(() => toggleColumnVisibility("table-1", "id", columns, required, storage)).toThrow(
        /Cannot hide required column: id/
      );
    });

    it("creates preference if none exists", () => {
      const storage = mockStorage();
      const columns = ["id", "name", "status"];
      const required = ["id"];

      const updated = toggleColumnVisibility("table-1", "status", columns, required, storage);

      expect(updated.visibleColumns).toEqual(["id", "name"]);
    });
  });
});
