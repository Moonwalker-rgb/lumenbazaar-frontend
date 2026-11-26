import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ColumnChooser, type ColumnOption } from "./column-chooser";

describe("ColumnChooser", () => {
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

  const defaultColumns: ColumnOption[] = [
    { id: "name", label: "Name", required: true },
    { id: "status", label: "Status" },
    { id: "date", label: "Date" },
    { id: "amount", label: "Amount" }
  ];

  const defaultRequiredColumns = ["name"];

  describe("rendering", () => {
    it("renders the trigger button", () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      expect(button).toBeInTheDocument();
    });

    it("shows custom button label", () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          buttonLabel="Table Columns"
        />
      );

      const button = screen.getByRole("button", { name: /Table Columns/i });
      expect(button).toBeInTheDocument();
    });

    it("displays hidden count badge when columns are hidden", async () => {
      const storage = mockStorage();
      // Manually set a preference with hidden columns
      const pref = {
        "test-table": {
          tableId: "test-table",
          visibleColumns: ["name", "status"],
          requiredColumns: ["name"]
        }
      };
      storage.setItem("lumenbazaar.frontend.column-preferences.v1", JSON.stringify(pref));

      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          storage={storage}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("does not show hidden count badge when all columns are visible", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      await waitFor(() => {
        const badges = screen.queryAllByText(/^\d+$/);
        expect(badges.length).toBe(0);
      });
    });
  });

  describe("menu interaction", () => {
    it("opens menu when button is clicked", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
    });

    it("closes menu when button is clicked again", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);
      await userEvent.click(button);

      // Menu should not be visible
      await waitFor(() => {
        const menu = screen.queryByRole("menu");
        expect(menu).not.toBeInTheDocument();
      });
    });

    it("closes menu when Escape key is pressed", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      fireEvent.keyDown(document, { key: "Escape" });

      await waitFor(() => {
        const menu = screen.queryByRole("menu");
        expect(menu).not.toBeInTheDocument();
      });
    });

    it("closes menu when clicking outside", async () => {
      render(
        <div>
          <ColumnChooser
            tableId="test-table"
            columns={defaultColumns}
            requiredColumnIds={defaultRequiredColumns}
          />
          <div data-testid="outside">Outside element</div>
        </div>
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const outside = screen.getByTestId("outside");
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        const menu = screen.queryByRole("menu");
        expect(menu).not.toBeInTheDocument();
      });
    });
  });

  describe("column visibility toggle", () => {
    it("displays all columns in menu", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      defaultColumns.forEach((col) => {
        expect(screen.getByText(col.label)).toBeInTheDocument();
      });
    });

    it("marks required columns with Required badge", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const requiredBadges = screen.getAllByText("Required");
      expect(requiredBadges.length).toBe(defaultRequiredColumns.length);
    });

    it("toggles column visibility when clicked", async () => {
      const storage = mockStorage();
      const onColumnsChange = vi.fn();

      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          onColumnsChange={onColumnsChange}
          storage={storage}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const statusCheckbox = screen.getByRole("menuitemcheckbox", { name: /Status/ });
      await userEvent.click(statusCheckbox);

      expect(onColumnsChange).toHaveBeenCalledWith(expect.not.arrayContaining(["status"]));
    });

    it("prevents clicking required columns", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const nameCheckbox = screen.getByRole("menuitemcheckbox", { name: /Name/ });
      expect(nameCheckbox).toBeDisabled();
    });

    it("preserves required columns in visible list", async () => {
      const storage = mockStorage();
      const onColumnsChange = vi.fn();

      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          onColumnsChange={onColumnsChange}
          storage={storage}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const statusCheckbox = screen.getByRole("menuitemcheckbox", { name: /Status/ });
      await userEvent.click(statusCheckbox);

      // Required columns should still be in the list
      expect(onColumnsChange).toHaveBeenCalledWith(expect.arrayContaining(defaultRequiredColumns));
    });
  });

  describe("reset functionality", () => {
    it("displays reset button in menu", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const resetButton = screen.getByRole("menuitem", { name: /Reset to default/ });
      expect(resetButton).toBeInTheDocument();
    });

    it("disables reset button when all columns are visible", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const resetButton = screen.getByRole("menuitem", { name: /Reset to default/ });
      expect(resetButton).toBeDisabled();
    });

    it("enables reset button when some columns are hidden", async () => {
      const storage = mockStorage();
      // Set up hidden columns
      const pref = {
        "test-table": {
          tableId: "test-table",
          visibleColumns: ["name", "status"],
          requiredColumns: ["name"]
        }
      };
      storage.setItem("lumenbazaar.frontend.column-preferences.v1", JSON.stringify(pref));

      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          storage={storage}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const resetButton = screen.getByRole("menuitem", { name: /Reset to default/ });
      expect(resetButton).not.toBeDisabled();
    });

    it("shows all columns when reset is clicked", async () => {
      const storage = mockStorage();
      const onColumnsChange = vi.fn();

      // Set up hidden columns
      const pref = {
        "test-table": {
          tableId: "test-table",
          visibleColumns: ["name", "status"],
          requiredColumns: ["name"]
        }
      };
      storage.setItem("lumenbazaar.frontend.column-preferences.v1", JSON.stringify(pref));

      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          onColumnsChange={onColumnsChange}
          storage={storage}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const resetButton = screen.getByRole("menuitem", { name: /Reset to default/ });
      await userEvent.click(resetButton);

      expect(onColumnsChange).toHaveBeenCalledWith(defaultColumns.map((c) => c.id));
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes on trigger button", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      expect(button).toHaveAttribute("aria-haspopup", "menu");
      expect(button).toHaveAttribute("aria-expanded", "false");

      await userEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("has proper ARIA role on menu", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
    });

    it("has proper ARIA roles on menu items", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const checkboxes = screen.getAllByRole("menuitemcheckbox");
      expect(checkboxes.length).toBe(defaultColumns.length);
    });

    it("indicates required columns via title attribute", async () => {
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const nameCheckbox = screen.getByRole("menuitemcheckbox", { name: /Name/ });
      expect(nameCheckbox).toHaveAttribute("title", "This column is required and cannot be hidden");
    });

    it("updates aria-checked status on toggle", async () => {
      const storage = mockStorage();
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          storage={storage}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const statusCheckbox = screen.getByRole("menuitemcheckbox", { name: /Status/ });
      expect(statusCheckbox).toHaveAttribute("aria-checked", "true");

      await userEvent.click(statusCheckbox);

      expect(statusCheckbox).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("persistence", () => {
    it("persists column preferences to storage", async () => {
      const storage = mockStorage();
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          storage={storage}
        />
      );

      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const statusCheckbox = screen.getByRole("menuitemcheckbox", { name: /Status/ });
      await userEvent.click(statusCheckbox);

      const stored = JSON.parse(
        storage.getItem("lumenbazaar.frontend.column-preferences.v1") || "{}"
      );
      expect(stored["test-table"].visibleColumns).not.toContain("status");
    });

    it("loads persisted preferences on mount", async () => {
      const storage = mockStorage();
      const pref = {
        "test-table": {
          tableId: "test-table",
          visibleColumns: ["name", "status"],
          requiredColumns: ["name"]
        }
      };
      storage.setItem("lumenbazaar.frontend.column-preferences.v1", JSON.stringify(pref));

      const onColumnsChange = vi.fn();
      render(
        <ColumnChooser
          tableId="test-table"
          columns={defaultColumns}
          requiredColumnIds={defaultRequiredColumns}
          onColumnsChange={onColumnsChange}
          storage={storage}
        />
      );

      // After mount, should reflect stored preferences
      const button = screen.getByRole("button", { name: /Columns/i });
      await userEvent.click(button);

      const dateCheckbox = screen.getByRole("menuitemcheckbox", { name: /Date/ });
      expect(dateCheckbox).toHaveAttribute("aria-checked", "false");
    });
  });
});
