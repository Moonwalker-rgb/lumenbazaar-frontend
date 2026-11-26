import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { apiClient } from "@/services/api/client";
import { createQueryClient } from "@/services/api/query";
import type { Receipt } from "@/services/api/schemas";

import { ReceiptDetailPage } from "./receipt-detail-page";

const getReceiptMock = vi.mocked(apiClient.getReceipt);

// Mock the API client
vi.mock("@/services/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/api/client")>();
  return {
    ...actual,
    apiClient: {
      getReceipt: vi.fn()
    }
  };
});

// Mock the payments service
vi.mock("@/services/payments", () => ({
  explorerTransactionUrl: vi.fn((network: string, hash: string) => {
    if (hash && /^[a-f0-9]{64}$/i.test(hash)) {
      return `https://stellar.expert/explorer/${network === "stellar:testnet" ? "testnet" : "public"}/tx/${hash}`;
    }
    return null;
  }),
  isValidTransactionHash: vi.fn((hash: string | null | undefined) => {
    if (!hash || typeof hash !== "string") {
      return false;
    }
    return /^[a-f0-9]{64}$/i.test(hash);
  }),
  isSyntheticTransactionId: vi.fn((hash: string | null | undefined) => {
    if (!hash || typeof hash !== "string") {
      return false;
    }
    return hash.startsWith("upto-") || hash.startsWith("exact-") || hash.startsWith("playground_");
  })
}));

describe("ReceiptDetailPage", () => {
  it("renders a loading state while fetching the receipt", () => {
    getReceiptMock.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_123" />
      </QueryClientProvider>
    );

    expect(screen.getByText("Loading receipt details")).toBeInTheDocument();
  });

  it("renders receipt details when successfully loaded", async () => {
    const mockReceipt: Receipt = {
      amount: "100",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_123",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_abc123",
      failureCode: null,
      failureReason: null,
      id: "receipt_123",
      ledger: 12345,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_123",
      resourceId: "resource_456",
      sellerId: "seller_789",
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "tx_hash_abc123",
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Receipt information")).toBeInTheDocument();
    });

    expect(screen.getByText("receipt_123")).toBeInTheDocument();
    expect(screen.getAllByText("finalized").length).toBeGreaterThan(0);
    expect(screen.getByText("stellar:testnet")).toBeInTheDocument();
    expect(screen.getByText("100 USDC")).toBeInTheDocument();
  });

  it("renders finality confirmation section for finalized receipts", async () => {
    const mockReceipt: Receipt = {
      amount: "50",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_123",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_abc123",
      failureCode: null,
      failureReason: null,
      id: "receipt_456",
      ledger: 54321,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_456",
      resourceId: null,
      sellerId: null,
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_456" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Finality confirmation")).toBeInTheDocument();
    });

    expect(
      screen.getByText("abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789")
    ).toBeInTheDocument();
    expect(screen.getByText("54321")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on Stellar explorer/ })).toBeInTheDocument();
  });

  it("renders failure information for failed receipts", async () => {
    const mockReceipt: Receipt = {
      amount: "25",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_failed",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_fail",
      failureCode: "AMOUNT_MISMATCH",
      failureReason: "Payment amount did not match resource requirement",
      id: "receipt_failed",
      ledger: null,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_failed",
      resourceId: null,
      sellerId: null,
      settledAt: null,
      status: "failed",
      transactionHash: null,
      updatedAt: "2026-10-15T10:01:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_failed" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Failure information")).toBeInTheDocument();
    });

    expect(screen.getByText("AMOUNT_MISMATCH")).toBeInTheDocument();
    expect(
      screen.getByText("Payment amount did not match resource requirement")
    ).toBeInTheDocument();
  });

  it("renders pending state message for pending receipts", async () => {
    const mockReceipt: Receipt = {
      amount: "75",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_pending",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_pending",
      failureCode: null,
      failureReason: null,
      id: "receipt_pending",
      ledger: null,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_pending",
      resourceId: null,
      sellerId: null,
      settledAt: null,
      status: "pending",
      transactionHash: null,
      updatedAt: "2026-10-15T10:00:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_pending" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Pending settlement")).toBeInTheDocument();
    });

    expect(screen.getByText(/awaiting finalization on the Stellar network/)).toBeInTheDocument();
  });

  it("renders an error state when the receipt cannot be retrieved", async () => {
    const error = new Error("Not found");
    getReceiptMock.mockRejectedValue(error);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_missing" />
      </QueryClientProvider>
    );

    await waitFor(
      () => {
        expect(screen.getByText("Receipt unavailable")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText("Not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("includes associated resource information when present", async () => {
    const mockReceipt: Receipt = {
      amount: "100",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_123",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_abc123",
      failureCode: null,
      failureReason: null,
      id: "receipt_123",
      ledger: 12345,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_123",
      resourceId: "resource_456",
      sellerId: "seller_789",
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "tx_hash_abc123",
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Associated resource")).toBeInTheDocument();
    });

    expect(screen.getByText("resource_456")).toBeInTheDocument();
  });

  it("includes seller information when present", async () => {
    const mockReceipt: Receipt = {
      amount: "100",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_123",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_abc123",
      failureCode: null,
      failureReason: null,
      id: "receipt_123",
      ledger: 12345,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_123",
      resourceId: null,
      sellerId: "seller_789",
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "tx_hash_abc123",
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Seller information")).toBeInTheDocument();
    });

    expect(screen.getByText("seller_789")).toBeInTheDocument();
  });

  it("calls the API client with the correct receipt ID", async () => {
    const mockReceipt: Receipt = {
      amount: "100",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_123",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_abc123",
      failureCode: null,
      failureReason: null,
      id: "receipt_malformed_id",
      ledger: 12345,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_123",
      resourceId: null,
      sellerId: null,
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "tx_hash_abc123",
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_malformed_id" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(apiClient.getReceipt).toHaveBeenCalledWith("receipt_malformed_id");
    });
  });

  it("displays finalized receipt with valid transaction hash on testnet", async () => {
    const mockReceipt: Receipt = {
      amount: "50.5",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_testnet",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_testnet",
      failureCode: null,
      failureReason: null,
      id: "receipt_testnet_valid",
      ledger: 99999,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_testnet",
      resourceId: "resource_001",
      sellerId: "seller_001",
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "abc123def456abc123def456abc123def456abc123def456abc123def456abc1",
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_testnet_valid" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Finality confirmation")).toBeInTheDocument();
    });

    // Verify testnet-specific content
    expect(screen.getByText(/Testnet/)).toBeInTheDocument();
    expect(screen.getByText("99999")).toBeInTheDocument();
    expect(
      screen.getByText(/abc123def456abc123def456abc123def456abc123def456abc123def456abc1/)
    ).toBeInTheDocument();

    // Verify explorer link
    const explorerLink = screen.getByRole("link", { name: /View on Stellar explorer/ });
    expect(explorerLink).toHaveAttribute("href", expect.stringContaining("testnet"));
  });

  it("displays finalized receipt with malformed transaction hash", async () => {
    const mockReceipt: Receipt = {
      amount: "25",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_malformed_hash",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_malformed",
      failureCode: null,
      failureReason: null,
      id: "receipt_malformed_hash",
      ledger: 55555,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_malformed_hash",
      resourceId: null,
      sellerId: null,
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "not_a_valid_hash", // Malformed hash
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_malformed_hash" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Finality confirmation")).toBeInTheDocument();
    });

    // Should display the hash even though it's malformed
    expect(screen.getByText("not_a_valid_hash")).toBeInTheDocument();

    // Should show warning instead of explorer link
    expect(
      screen.getByText(/Transaction hash is invalid and cannot be verified/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /View on Stellar explorer/ })
    ).not.toBeInTheDocument();
  });

  it("displays pending receipt without transaction details", async () => {
    const mockReceipt: Receipt = {
      amount: "100",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_pending",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_pending",
      failureCode: null,
      failureReason: null,
      id: "receipt_pending_comprehensive",
      ledger: null,
      network: "stellar:pubnet",
      paymentAttemptId: "attempt_pending",
      resourceId: null,
      sellerId: null,
      settledAt: null,
      status: "pending",
      transactionHash: null,
      updatedAt: "2026-10-15T10:00:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_pending_comprehensive" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Pending settlement")).toBeInTheDocument();
    });

    // Should display warning badge
    expect(screen.getAllByText("pending").length).toBeGreaterThan(0);

    // Should show mainnet badge
    expect(screen.getByText(/Mainnet/)).toBeInTheDocument();

    // Should NOT show finality confirmation
    expect(screen.queryByText("Finality confirmation")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Stellar explorer/ })).not.toBeInTheDocument();
  });

  it("displays failed receipt with all failure details", async () => {
    const mockReceipt: Receipt = {
      amount: "100",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_failed_comprehensive",
      createdAt: "2026-10-15T09:00:00Z",
      evidenceHash: "hash_failed",
      failureCode: "INSUFFICIENT_BALANCE",
      failureReason:
        "The seller account does not have sufficient balance to complete this payment.",
      id: "receipt_failed_comprehensive",
      ledger: null,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_failed_comprehensive",
      resourceId: "resource_failed",
      sellerId: "seller_failed",
      settledAt: null,
      status: "failed",
      transactionHash: null,
      updatedAt: "2026-10-15T09:01:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_failed_comprehensive" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Failure information")).toBeInTheDocument();
    });

    // Should display danger badge
    expect(screen.getAllByText("failed").length).toBeGreaterThan(0);

    // Should display failure details
    expect(screen.getByText("INSUFFICIENT_BALANCE")).toBeInTheDocument();
    expect(
      screen.getByText(/The seller account does not have sufficient balance/)
    ).toBeInTheDocument();

    // Should NOT show finality confirmation
    expect(screen.queryByText("Finality confirmation")).not.toBeInTheDocument();

    // Should still show resource and seller info
    expect(screen.getByText("resource_failed")).toBeInTheDocument();
    expect(screen.getByText("seller_failed")).toBeInTheDocument();
  });

  it("displays different badges for different networks", async () => {
    const mockReceipt: Receipt = {
      amount: "100",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_pubnet",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_pubnet",
      failureCode: null,
      failureReason: null,
      id: "receipt_pubnet",
      ledger: 88888,
      network: "stellar:pubnet",
      paymentAttemptId: "attempt_pubnet",
      resourceId: null,
      sellerId: null,
      settledAt: "2026-10-15T10:05:00Z",
      status: "finalized",
      transactionHash: "def789abc456def789abc456def789abc456def789abc456def789abc456def7",
      updatedAt: "2026-10-15T10:05:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_pubnet" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Finality confirmation")).toBeInTheDocument();
    });

    // Should display mainnet badge (not testnet)
    const badges = screen.getAllByText(/Mainnet|Testnet/);
    expect(badges.some((badge) => badge.textContent?.includes("Mainnet"))).toBe(true);

    // Explorer link should point to public network
    const explorerLink = screen.getByRole("link", { name: /View on Stellar explorer/ });
    expect(explorerLink).toHaveAttribute("href", expect.stringContaining("public"));
  });

  it("handles receipt with all optional fields populated", async () => {
    const mockReceipt: Receipt = {
      amount: "123.45",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_all_fields",
      createdAt: "2026-10-15T09:00:00Z",
      evidenceHash: "hash_all_fields",
      failureCode: null,
      failureReason: null,
      id: "receipt_all_fields",
      ledger: 777777,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_all_fields",
      resourceId: "resource_complete",
      sellerId: "seller_complete",
      settledAt: "2026-10-15T09:30:00Z",
      status: "finalized",
      transactionHash: "aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899",
      updatedAt: "2026-10-15T09:30:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_all_fields" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Receipt information")).toBeInTheDocument();
    });

    // Verify all sections are displayed
    expect(screen.getByText("Receipt information")).toBeInTheDocument();
    expect(screen.getByText("Payment verification")).toBeInTheDocument();
    expect(screen.getByText("Finality confirmation")).toBeInTheDocument();
    expect(screen.getByText("Associated resource")).toBeInTheDocument();
    expect(screen.getByText("Seller information")).toBeInTheDocument();

    // Verify values
    expect(screen.getByText("123.45 USDC")).toBeInTheDocument();
    expect(screen.getByText("resource_complete")).toBeInTheDocument();
    expect(screen.getByText("seller_complete")).toBeInTheDocument();
    expect(screen.getByText("777777")).toBeInTheDocument();
  });

  it("handles receipt with minimal fields (no optional fields)", async () => {
    const mockReceipt: Receipt = {
      amount: "10",
      assetCode: "USDC",
      assetIssuer: "GBUQWP3BOUZX34ULNQG23RQ6F4BVWBRXM6LSV7XYJJJX34ZPUSC6D6P2",
      correlationId: "corr_minimal",
      createdAt: "2026-10-15T10:00:00Z",
      evidenceHash: "hash_minimal",
      failureCode: null,
      failureReason: null,
      id: "receipt_minimal",
      ledger: null,
      network: "stellar:testnet",
      paymentAttemptId: "attempt_minimal",
      resourceId: null,
      sellerId: null,
      settledAt: null,
      status: "pending",
      transactionHash: null,
      updatedAt: "2026-10-15T10:00:00Z"
    };
    getReceiptMock.mockResolvedValue(mockReceipt);

    render(
      <QueryClientProvider client={createQueryClient()}>
        <ReceiptDetailPage receiptId="receipt_minimal" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Receipt information")).toBeInTheDocument();
    });

    // Should display required sections
    expect(screen.getByText("Receipt information")).toBeInTheDocument();
    expect(screen.getByText("Payment verification")).toBeInTheDocument();
    expect(screen.getByText("Pending settlement")).toBeInTheDocument();

    // Should NOT display optional sections
    expect(screen.queryByText("Finality confirmation")).not.toBeInTheDocument();
    expect(screen.queryByText("Associated resource")).not.toBeInTheDocument();
    expect(screen.queryByText("Seller information")).not.toBeInTheDocument();
  });
});
