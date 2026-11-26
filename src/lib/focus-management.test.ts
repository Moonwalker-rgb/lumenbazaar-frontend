import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  findPageHeading,
  focusHeadingWithoutScroll,
  restorePreviousFocus,
  manageFocusAfterOverlay,
  handleRouteChangeFocus
} from "./focus-management";

function waitForNextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

describe("Focus Management", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe("findPageHeading", () => {
    it("finds h1 element", () => {
      const h1 = document.createElement("h1");
      h1.textContent = "Page Title";
      container.appendChild(h1);

      const result = findPageHeading(container);
      expect(result).toBe(h1);
    });

    it("prefers h1 over h2", () => {
      const h1 = document.createElement("h1");
      const h2 = document.createElement("h2");
      container.appendChild(h1);
      container.appendChild(h2);

      const result = findPageHeading(container);
      expect(result).toBe(h1);
    });

    it("falls back to h2 when h1 not found", () => {
      const h2 = document.createElement("h2");
      container.appendChild(h2);

      const result = findPageHeading(container);
      expect(result).toBe(h2);
    });

    it("falls back to main element", () => {
      const main = document.createElement("main");
      container.appendChild(main);

      const result = findPageHeading(container);
      expect(result).toBe(main);
    });

    it("returns null when no heading found", () => {
      const result = findPageHeading(container);
      expect(result).toBeNull();
    });
  });

  describe("focusHeadingWithoutScroll", () => {
    it("focuses h1 element and makes it focusable", () => {
      const h1 = document.createElement("h1");
      h1.textContent = "Page Title";
      container.appendChild(h1);

      const result = focusHeadingWithoutScroll();
      expect(result).toBe(true);
      expect(document.activeElement).toBe(h1);
      expect(h1.getAttribute("tabindex")).toBe("-1");
    });

    it("skips if element already focused", () => {
      const h1 = document.createElement("h1");
      h1.textContent = "Page Title";
      container.appendChild(h1);
      h1.tabIndex = -1;
      h1.focus();

      const result = focusHeadingWithoutScroll({ force: false });
      expect(result).toBe(false);
    });

    it("forces focus when force=true", () => {
      const h1 = document.createElement("h1");
      h1.textContent = "Page Title";
      container.appendChild(h1);
      h1.focus();

      const result = focusHeadingWithoutScroll({ force: true });
      expect(result).toBe(true);
    });

    it("returns false when no heading found", () => {
      const result = focusHeadingWithoutScroll();
      expect(result).toBe(false);
    });

    it("focuses target element when provided", () => {
      const target = document.createElement("div");
      target.textContent = "Custom Target";
      container.appendChild(target);

      const result = focusHeadingWithoutScroll({ target });
      expect(result).toBe(true);
      expect(document.activeElement).toBe(target);
    });

    it("calls focus with preventScroll option", () => {
      const h1 = document.createElement("h1");
      container.appendChild(h1);

      const focusSpy = vi.spyOn(h1, "focus");
      focusHeadingWithoutScroll({ preventScroll: true });

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });
  });

  describe("restorePreviousFocus", () => {
    it("restores focus to element in DOM", () => {
      const button = document.createElement("button");
      button.textContent = "Trigger";
      container.appendChild(button);

      const result = restorePreviousFocus(button);
      expect(result).toBe(true);
      expect(document.activeElement).toBe(button);
    });

    it("returns false for null element", () => {
      const result = restorePreviousFocus(null);
      expect(result).toBe(false);
    });

    it("returns false if element not in DOM", () => {
      const button = document.createElement("button");
      const result = restorePreviousFocus(button);
      expect(result).toBe(false);
    });

    it("passes focus options to element.focus", () => {
      const button = document.createElement("button");
      container.appendChild(button);

      const focusSpy = vi.spyOn(button, "focus");
      restorePreviousFocus(button, { preventScroll: true });

      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });
  });

  describe("manageFocusAfterOverlay", () => {
    it("restores focus to trigger element", () => {
      const trigger = document.createElement("button");
      trigger.textContent = "Open Modal";
      container.appendChild(trigger);

      const result = manageFocusAfterOverlay(trigger);
      expect(result).toBe(true);
      expect(document.activeElement).toBe(trigger);
    });

    it("falls back to heading when trigger removed from DOM", () => {
      const trigger = document.createElement("button");
      const h1 = document.createElement("h1");
      container.appendChild(trigger);
      container.appendChild(h1);

      // Remove trigger before restoring
      container.removeChild(trigger);

      const result = manageFocusAfterOverlay(trigger);
      expect(result).toBe(true);
      expect(document.activeElement).toBe(h1);
    });

    it("returns false when trigger null and no heading", () => {
      const result = manageFocusAfterOverlay(null);
      expect(result).toBe(false);
    });

    it("prevents scroll by default", () => {
      const h1 = document.createElement("h1");
      container.appendChild(h1);

      const focusSpy = vi.spyOn(h1, "focus");
      manageFocusAfterOverlay(null);

      expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ preventScroll: true }));
    });
  });

  describe("handleRouteChangeFocus", () => {
    it("focuses heading after route change", async () => {
      const h1 = document.createElement("h1");
      h1.textContent = "New Page";
      container.appendChild(h1);

      handleRouteChangeFocus();

      // Wait for the requestAnimationFrame scheduled by handleRouteChangeFocus
      await waitForNextFrame();

      expect(document.activeElement).toBe(h1);
      expect(h1.getAttribute("tabindex")).toBe("-1");
    });

    it("forces focus on heading", async () => {
      const h1 = document.createElement("h1");
      h1.textContent = "New Page";
      container.appendChild(h1);
      h1.focus();

      handleRouteChangeFocus();

      await waitForNextFrame();

      expect(document.activeElement).toBe(h1);
    });

    it("prevents scroll during navigation", async () => {
      const h1 = document.createElement("h1");
      container.appendChild(h1);

      const focusSpy = vi.spyOn(h1, "focus");
      handleRouteChangeFocus({ preventScroll: true });

      await waitForNextFrame();

      expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ preventScroll: true }));
    });

    it("returns false in non-browser environment", () => {
      const originalWindow = global.window;
      // @ts-expect-error - testing environment variable
      delete global.window;

      const result = handleRouteChangeFocus();
      expect(result).toBe(false);

      global.window = originalWindow;
    });
  });

  describe("nested overlay behavior", () => {
    it("manages focus for nested modals correctly", () => {
      // Outer trigger
      const outerTrigger = document.createElement("button");
      outerTrigger.textContent = "Open Outer Modal";
      container.appendChild(outerTrigger);

      // Inner trigger (inside outer modal)
      const innerTrigger = document.createElement("button");
      innerTrigger.textContent = "Open Inner Modal";
      container.appendChild(innerTrigger);

      // Close inner modal - should focus inner trigger
      outerTrigger.focus();
      let result = manageFocusAfterOverlay(innerTrigger);
      expect(result).toBe(true);
      expect(document.activeElement).toBe(innerTrigger);

      // Close outer modal - should focus outer trigger
      result = manageFocusAfterOverlay(outerTrigger);
      expect(result).toBe(true);
      expect(document.activeElement).toBe(outerTrigger);
    });

    it("handles modal closing with removed trigger", () => {
      const h1 = document.createElement("h1");
      const trigger = document.createElement("button");
      container.appendChild(h1);
      container.appendChild(trigger);

      // Remove trigger (simulating DOM cleanup)
      container.removeChild(trigger);

      // Should fall back to heading
      const result = manageFocusAfterOverlay(trigger);
      expect(result).toBe(true);
      expect(document.activeElement).toBe(h1);
    });
  });
});
