import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DataFreshnessBadge,
  dataFreshnessState,
  getResultAge,
  isResultStale
} from "./data-freshness-badge";

describe("dataFreshnessState", () => {
  const observedAt = "2026-10-07T12:00:00.000Z";

  it("distinguishes fresh, stale, and explicit demo observations", () => {
    expect(dataFreshnessState(observedAt, "api", Date.parse(observedAt) + 30_000)).toBe("fresh");
    expect(dataFreshnessState(observedAt, "partial", Date.parse(observedAt) + 90_000)).toBe(
      "stale"
    );
    expect(dataFreshnessState(observedAt, "demo", Date.parse(observedAt) + 90_000)).toBe("demo");
  });

  it("treats invalid observation timestamps as stale", () => {
    expect(dataFreshnessState("invalid", "api", Date.parse(observedAt))).toBe("stale");
  });
});

describe("getResultAge", () => {
  const observedAt = "2026-10-07T12:00:00.000Z";
  const observedTime = Date.parse(observedAt);

  it("returns age in milliseconds for valid timestamps", () => {
    expect(getResultAge(observedAt, observedTime + 30_000)).toBe(30_000);
    expect(getResultAge(observedAt, observedTime + 60_000)).toBe(60_000);
  });

  it("returns -1 for invalid timestamps", () => {
    expect(getResultAge("invalid", observedTime)).toBe(-1);
  });

  it("returns 0 for timestamps at the observed time", () => {
    expect(getResultAge(observedAt, observedTime)).toBe(0);
  });
});

describe("isResultStale", () => {
  const observedAt = "2026-10-07T12:00:00.000Z";
  const observedTime = Date.parse(observedAt);

  it("identifies fresh results as not stale", () => {
    expect(isResultStale(observedAt, observedTime + 30_000)).toBe(false);
  });

  it("identifies results exceeding 60 seconds as stale", () => {
    expect(isResultStale(observedAt, observedTime + 61_000)).toBe(true);
  });

  it("treats invalid timestamps as stale", () => {
    expect(isResultStale("invalid", observedTime)).toBe(true);
  });
});

describe("DataFreshnessBadge", () => {
  const observedAt = "2026-10-07T12:00:00.000Z";

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse(observedAt) + 90_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders badge with freshness label for fresh results", () => {
    vi.setSystemTime(Date.parse(observedAt) + 30_000);
    render(<DataFreshnessBadge observedAt={observedAt} source="api" />);

    expect(screen.getByText(/Fresh · observed/)).toBeInTheDocument();
  });

  it("renders badge with stale label and refresh button for stale results", () => {
    const now = Date.parse(observedAt) + 90_000;
    vi.setSystemTime(now);
    const onRefresh = vi.fn();

    render(
      <DataFreshnessBadge
        observedAt={observedAt}
        source="api"
        onRefresh={onRefresh}
        isRefreshing={false}
      />,
      { hydrate: false }
    );

    // Trigger the interval update
    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    const refreshButton = screen.getByRole("button", { name: /Refresh/ });
    expect(refreshButton).toBeInTheDocument();
    expect(screen.getByText(/Potentially stale · observed/)).toBeInTheDocument();

    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalled();
  });

  it("disables refresh button when isRefreshing is true", () => {
    const onRefresh = vi.fn();

    render(
      <DataFreshnessBadge
        observedAt={observedAt}
        source="api"
        onRefresh={onRefresh}
        isRefreshing={true}
      />
    );

    const refreshButton = screen.getByRole("button", { name: /Refresh/ });
    expect(refreshButton).toBeDisabled();
  });

  it("shows loading spinner while refreshing", () => {
    render(
      <DataFreshnessBadge
        observedAt={observedAt}
        source="api"
        onRefresh={() => {}}
        isRefreshing={true}
      />
    );

    const refreshButton = screen.getByRole("button", { name: /Refresh/ });
    expect(within(refreshButton).getByText("Refreshing")).toBeInTheDocument();
    expect(refreshButton.querySelector("svg")).toHaveClass("animate-spin");
  });

  it("does not show refresh button for demo source", () => {
    const onRefresh = vi.fn();

    render(<DataFreshnessBadge observedAt={observedAt} source="demo" onRefresh={onRefresh} />);

    expect(screen.queryByRole("button", { name: /Refresh/ })).not.toBeInTheDocument();
  });

  it("does not show refresh button when onRefresh is not provided", () => {
    render(<DataFreshnessBadge observedAt={observedAt} source="api" />);

    expect(screen.queryByRole("button", { name: /Refresh/ })).not.toBeInTheDocument();
  });
});
