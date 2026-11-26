"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Check, ChevronDown, RotateCcw } from "lucide-react";
import { clsx } from "clsx";

import { Button } from "@/components/ui/button";
import {
  toggleColumnVisibility,
  resetColumnPreference,
  getVisibleColumns,
  type ColumnPreference
} from "@/services/column-preferences";

export interface ColumnOption {
  id: string;
  label: string;
  required?: boolean;
}

const subscribeToNoStore = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export interface ColumnChooserProps {
  /**
   * Unique identifier for the table this chooser manages.
   * Used as the key for storing preferences.
   */
  tableId: string;

  /**
   * All available columns for this table.
   */
  columns: ColumnOption[];

  /**
   * Column IDs that must remain visible.
   * Users cannot hide these columns.
   */
  requiredColumnIds: string[];

  /**
   * Callback when column visibility changes.
   * Receives the updated list of visible column IDs.
   */
  onColumnsChange?: (visibleColumns: string[]) => void;

  /**
   * Custom class name for the trigger button.
   */
  buttonClassName?: string;

  /**
   * Label for the trigger button. Defaults to "Columns".
   */
  buttonLabel?: string;

  /**
   * Storage to use for persistence. Defaults to localStorage.
   */
  storage?: Storage | undefined;
}

/**
 * ColumnChooser: A dropdown menu for toggling table column visibility.
 *
 * Features:
 * - Toggle individual column visibility
 * - Prevents hiding required columns
 * - Persists preferences to localStorage
 * - Fully accessible with keyboard navigation
 * - Responsive design for mobile and desktop
 * - Reset button to restore default visibility
 */
export function ColumnChooser({
  tableId,
  columns,
  requiredColumnIds,
  onColumnsChange,
  buttonClassName,
  buttonLabel = "Columns",
  storage
}: ColumnChooserProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    return getVisibleColumns(
      tableId,
      columns.map((c) => c.id),
      storage
    );
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hydration-safe mount state: the server snapshot is false during SSR and
  // hydration, while the client snapshot is true immediately afterwards. This
  // avoids a synchronous setState in an effect.
  const mounted = useSyncExternalStore(subscribeToNoStore, getClientSnapshot, getServerSnapshot);

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on Escape key and restore focus
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        // Restore focus to trigger after closing
        requestAnimationFrame(() => {
          focusTrigger();
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Restore focus when menu closes
  useEffect(() => {
    if (isOpen) return;

    // Only restore if we previously had focus
    if (
      document.activeElement === menuRef.current ||
      menuRef.current?.contains(document.activeElement as Node)
    ) {
      focusTrigger();
    }
  }, [isOpen]);

  const handleToggleColumn = useCallback(
    (columnId: string) => {
      try {
        const updated = toggleColumnVisibility(
          tableId,
          columnId,
          columns.map((c) => c.id),
          requiredColumnIds,
          storage
        );
        setVisibleColumns(updated.visibleColumns);
        onColumnsChange?.(updated.visibleColumns);
      } catch (error) {
        // Silently ignore errors (e.g., attempting to hide required column)
        console.debug("Column toggle error:", error);
      }
    },
    [tableId, columns, requiredColumnIds, onColumnsChange, storage]
  );

  const handleReset = useCallback(() => {
    try {
      const updated = resetColumnPreference(
        tableId,
        columns.map((c) => c.id),
        requiredColumnIds,
        storage
      );
      setVisibleColumns(updated.visibleColumns);
      onColumnsChange?.(updated.visibleColumns);
    } catch (error) {
      console.debug("Reset columns error:", error);
    }
  }, [tableId, columns, requiredColumnIds, onColumnsChange, storage]);

  const hiddenCount = useMemo(
    () => columns.length - visibleColumns.length,
    [columns.length, visibleColumns.length]
  );

  const allVisible = hiddenCount === 0;

  // The shared Button does not forward refs, so focus its DOM node via the wrapper.
  function focusTrigger() {
    triggerRef.current?.querySelector("button")?.focus();
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <div className="inline-flex" ref={triggerRef}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="secondary"
          className={clsx("flex items-center gap-2", buttonClassName)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-label={`${buttonLabel}${hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ""}`}
        >
          {buttonLabel}
          {hiddenCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
              {hiddenCount}
            </span>
          )}
          <ChevronDown aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-slate-200 bg-white shadow-lg"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              focusTrigger();
            }
          }}
        >
          <div className="space-y-1 p-2">
            {/* Column options */}
            {columns.map((column) => {
              const isVisible = visibleColumns.includes(column.id);
              const isRequired = requiredColumnIds.includes(column.id);

              return (
                <button
                  key={column.id}
                  role="menuitemcheckbox"
                  aria-checked={isVisible}
                  disabled={isRequired}
                  onClick={() => {
                    if (!isRequired) {
                      handleToggleColumn(column.id);
                    }
                  }}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left",
                    "transition-colors duration-75",
                    isRequired
                      ? "cursor-default bg-slate-50 text-slate-700"
                      : "cursor-pointer hover:bg-slate-100",
                    isVisible && "font-medium text-slate-950"
                  )}
                  title={isRequired ? "This column is required and cannot be hidden" : undefined}
                >
                  <span
                    className={clsx(
                      "flex h-4 w-4 items-center justify-center rounded border",
                      isVisible ? "border-teal-600 bg-teal-50" : "border-slate-300 bg-white"
                    )}
                  >
                    {isVisible && <Check aria-hidden="true" className="h-3 w-3 text-teal-700" />}
                  </span>
                  <span className="flex-1">{column.label}</span>
                  {isRequired && (
                    <span className="text-xs font-medium text-slate-500">Required</span>
                  )}
                </button>
              );
            })}

            {/* Divider */}
            <div className="my-1 border-t border-slate-200" />

            {/* Reset button */}
            <button
              role="menuitem"
              onClick={handleReset}
              disabled={allVisible}
              className={clsx(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700",
                "transition-colors duration-75",
                allVisible
                  ? "cursor-default text-slate-400"
                  : "cursor-pointer hover:bg-slate-100 hover:text-slate-900"
              )}
              title={allVisible ? "All columns are already visible" : undefined}
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reset to default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
