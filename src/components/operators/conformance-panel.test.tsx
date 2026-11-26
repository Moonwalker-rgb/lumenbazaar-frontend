import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { demoConformanceRun } from "@/fixtures/lumenbazaar";
import { createQueryClient } from "@/services/api/query";
import { loadOperatorSnapshot } from "@/services/operators";

import { ConformancePanel } from "./conformance-panel";

const loadOperatorSnapshotMock = vi.mocked(loadOperatorSnapshot);

// Mock the operator service
vi.mock("@/services/operators", async () => {
  const actual =
    await vi.importActual<typeof import("@/services/operators")>("@/services/operators");
  return {
    ...actual,
    loadOperatorSnapshot: vi.fn()
  };
});

describe("ConformancePanel", () => {
  it("renders conformance evidence when data is successfully loaded", async () => {
    loadOperatorSnapshotMock.mockResolvedValue({
      checkedAt: "2026-10-15T10:00:00Z",
      conformance: demoConformanceRun,
      healthRows: [
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "lumenbazaar-backend responded for api.",
          name: "API",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Worker queue telemetry is unavailable through the JSON API.",
          name: "Worker",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Search follows backend readiness.",
          name: "Search",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Redis readiness check passed.",
          name: "Redis",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Database readiness check passed.",
          name: "Postgres",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "RPC readiness check passed.",
          name: "RPC",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Horizon readiness check passed.",
          name: "Horizon",
          status: "operational"
        }
      ],
      metrics: {
        queueDepth: { "settlement-confirmation": null },
        settlementLatencyP95Ms: null,
        settlementSuccessRate: null
      },
      networks: [],
      source: "api" as const,
      supported: { extensions: [], kinds: [], signers: {} },
      version: {
        commit: "abc123",
        environment: "testnet",
        service: "lumenbazaar-backend",
        version: "0.1.0"
      },
      warnings: []
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ConformancePanel />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Conformance")).toBeInTheDocument();
    });

    expect(screen.getByText("Live API data")).toBeInTheDocument();
    expect(screen.getByText("Endpoint checks")).toBeInTheDocument();
    expect(screen.getByText("/supported")).toBeInTheDocument();
  });

  it("renders loading state while fetching operator snapshot", () => {
    loadOperatorSnapshotMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ConformancePanel />
      </QueryClientProvider>
    );

    expect(screen.getByText("Loading conformance evidence")).toBeInTheDocument();
  });

  it("renders error state when snapshot is unavailable", async () => {
    loadOperatorSnapshotMock.mockRejectedValue(new Error("Backend offline"));

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ConformancePanel />
      </QueryClientProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Conformance unavailable")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText("Backend offline")).toBeInTheDocument();
  });

  it("renders conformance unavailable when snapshot.conformance is null", async () => {
    loadOperatorSnapshotMock.mockResolvedValue({
      checkedAt: "2026-10-15T10:00:00Z",
      conformance: null,
      healthRows: [
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "lumenbazaar-backend responded for api.",
          name: "API",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Worker queue telemetry is unavailable through the JSON API.",
          name: "Worker",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Search follows backend readiness.",
          name: "Search",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Redis readiness check passed.",
          name: "Redis",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Database readiness check passed.",
          name: "Postgres",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "RPC readiness check passed.",
          name: "RPC",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Horizon readiness check passed.",
          name: "Horizon",
          status: "operational"
        }
      ],
      metrics: {
        queueDepth: { "settlement-confirmation": null },
        settlementLatencyP95Ms: null,
        settlementSuccessRate: null
      },
      networks: [],
      source: "partial" as const,
      supported: { extensions: [], kinds: [], signers: {} },
      version: null,
      warnings: ["conformance"]
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ConformancePanel />
      </QueryClientProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Conformance unavailable")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(
      screen.getByText("No live conformance run could be verified from the configured backend.")
    ).toBeInTheDocument();
  });

  it("displays warnings when conformance fails during partial outage", async () => {
    loadOperatorSnapshotMock.mockResolvedValue({
      checkedAt: "2026-10-15T10:00:00Z",
      conformance: demoConformanceRun,
      healthRows: [
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "lumenbazaar-backend responded for api.",
          name: "API",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Worker queue telemetry is unavailable through the JSON API.",
          name: "Worker",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Search follows backend readiness.",
          name: "Search",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Redis readiness check passed.",
          name: "Redis",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Database readiness check passed.",
          name: "Postgres",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "RPC readiness check passed.",
          name: "RPC",
          status: "operational"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Horizon readiness check passed.",
          name: "Horizon",
          status: "operational"
        }
      ],
      metrics: {
        queueDepth: { "settlement-confirmation": null },
        settlementLatencyP95Ms: null,
        settlementSuccessRate: null
      },
      networks: [],
      source: "partial" as const,
      supported: { extensions: [], kinds: [], signers: {} },
      version: null,
      warnings: ["conformance", "metrics"]
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ConformancePanel />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Partial API data")).toBeInTheDocument();
    });

    // Verify warnings are displayed
    expect(screen.getByText("conformance unavailable")).toBeInTheDocument();
    expect(screen.getByText("metrics unavailable")).toBeInTheDocument();
  });

  it("never displays fixture conformance data when API fails", async () => {
    loadOperatorSnapshotMock.mockResolvedValue({
      checkedAt: "2026-10-15T10:00:00Z",
      conformance: null,
      healthRows: [
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "API health could not be verified.",
          name: "API",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Worker queue telemetry is unavailable through the JSON API.",
          name: "Worker",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Search readiness could not be verified.",
          name: "Search",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Redis readiness is unavailable.",
          name: "Redis",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Database readiness is unavailable.",
          name: "Postgres",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "RPC readiness is unavailable.",
          name: "RPC",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Horizon readiness is unavailable.",
          name: "Horizon",
          status: "unknown"
        }
      ],
      metrics: {
        queueDepth: { "settlement-confirmation": null },
        settlementLatencyP95Ms: null,
        settlementSuccessRate: null
      },
      networks: [],
      source: "unavailable" as const,
      supported: { extensions: [], kinds: [], signers: {} },
      version: null,
      warnings: [
        "health",
        "readiness",
        "networks",
        "supported",
        "conformance",
        "version",
        "metrics"
      ]
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ConformancePanel />
      </QueryClientProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Conformance unavailable")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Explicitly verify that no conformance data is shown
    expect(screen.queryByText("Endpoint checks")).not.toBeInTheDocument();
    expect(screen.queryByText("Scheme coverage")).not.toBeInTheDocument();
    expect(screen.queryByText("Latest run")).not.toBeInTheDocument();
    // Verify no demo badge appears
    expect(screen.queryByText("Explicit demo data")).not.toBeInTheDocument();
  });

  it("displays unavailable badge and warning message when completely offline", async () => {
    loadOperatorSnapshotMock.mockResolvedValue({
      checkedAt: "2026-10-15T10:00:00Z",
      conformance: demoConformanceRun,
      healthRows: [
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "API health could not be verified.",
          name: "API",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Worker queue telemetry is unavailable through the JSON API.",
          name: "Worker",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Search readiness could not be verified.",
          name: "Search",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Redis readiness is unavailable.",
          name: "Redis",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Database readiness is unavailable.",
          name: "Postgres",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "RPC readiness is unavailable.",
          name: "RPC",
          status: "unknown"
        },
        {
          checkedAt: "2026-10-15T10:00:00Z",
          detail: "Horizon readiness is unavailable.",
          name: "Horizon",
          status: "unknown"
        }
      ],
      metrics: {
        queueDepth: { "settlement-confirmation": null },
        settlementLatencyP95Ms: null,
        settlementSuccessRate: null
      },
      networks: [],
      source: "unavailable" as const,
      supported: { extensions: [], kinds: [], signers: {} },
      version: null,
      warnings: [
        "health",
        "readiness",
        "networks",
        "supported",
        "conformance",
        "version",
        "metrics"
      ]
    });

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ConformancePanel />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should show the degraded source badge
      const badge = screen.getByText("Partial API data");
      expect(badge).toBeInTheDocument();
    });

    // Warning badges reflect every unavailable data source
    expect(screen.getByText("health unavailable")).toBeInTheDocument();
    expect(screen.getByText("readiness unavailable")).toBeInTheDocument();
  });
});
