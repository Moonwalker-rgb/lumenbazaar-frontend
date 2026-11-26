import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { useMotionPreference } from "./useMotionPreference";

describe("useMotionPreference", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;
  let removeEventListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Create mocks for matchMedia
    addEventListenerMock = vi.fn();
    removeEventListenerMock = vi.fn();

    matchMediaMock = vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? false : false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      dispatchEvent: vi.fn()
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with prefersReducedMotion as false (motion enabled)", () => {
    const { result } = renderHook(() => useMotionPreference());

    // Initially returns false (motion enabled)
    expect(result.current.prefersReducedMotion).toBe(false);
    expect(result.current.enableMotion).toBe(true);
    expect(result.current.shouldReduceMotion).toBe(false);
  });

  it("should mark as hydrated after useEffect runs", async () => {
    const { result } = renderHook(() => useMotionPreference());

    expect(result.current.isHydrated).toBe(false);

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });
  });

  it("should detect prefers-reduced-motion when matchMedia matches", async () => {
    matchMediaMock = vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock
    });

    const { result } = renderHook(() => useMotionPreference());

    await waitFor(() => {
      expect(result.current.prefersReducedMotion).toBe(true);
      expect(result.current.shouldReduceMotion).toBe(true);
      expect(result.current.enableMotion).toBe(false);
    });
  });

  it("should add event listener for preference changes", async () => {
    const { result } = renderHook(() => useMotionPreference());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(addEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("should remove event listener on cleanup", async () => {
    const { result, unmount } = renderHook(() => useMotionPreference());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(addEventListenerMock).toHaveBeenCalled();

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function));
  });

  it("should handle preference changes via listener", async () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

    addEventListenerMock = vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
      if (event === "change") {
        changeHandler = handler;
      }
    });

    matchMediaMock = vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)" ? false : false,
      media: query,
      onchange: null,
      addEventListener: addEventListenerMock,
      removeEventListener: removeEventListenerMock,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn()
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock
    });

    const { result } = renderHook(() => useMotionPreference());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    // Simulate user changing preference to reduced motion
    if (changeHandler) {
      act(() => {
        changeHandler!({
          matches: true,
          media: "(prefers-reduced-motion: reduce)"
        } as MediaQueryListEvent);
      });
    }

    await waitFor(() => {
      expect(result.current.prefersReducedMotion).toBe(true);
    });
  });

  it("should not call matchMedia on server side (window undefined)", () => {
    // renderHook needs a DOM, so render a tiny component on the server instead.
    const originalWindow = global.window;

    function MotionProbe() {
      useMotionPreference();
      return null;
    }

    try {
      Reflect.deleteProperty(globalThis, "window");
      expect(() => renderToString(createElement(MotionProbe))).not.toThrow();
    } finally {
      global.window = originalWindow;
    }
  });

  it("should provide all expected properties", async () => {
    const { result } = renderHook(() => useMotionPreference());

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(result.current).toHaveProperty("prefersReducedMotion");
    expect(result.current).toHaveProperty("isHydrated");
    expect(result.current).toHaveProperty("shouldReduceMotion");
    expect(result.current).toHaveProperty("enableMotion");

    expect(typeof result.current.prefersReducedMotion).toBe("boolean");
    expect(typeof result.current.isHydrated).toBe("boolean");
    expect(typeof result.current.shouldReduceMotion).toBe("boolean");
    expect(typeof result.current.enableMotion).toBe("boolean");
  });
});
