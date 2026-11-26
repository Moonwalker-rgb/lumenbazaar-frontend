import { describe, it, expect } from "vitest";

import { mapErrorCategory, mapWalletErrorCode } from "./error-mapper";
import { ApiClientError } from "@/services/api/client";

describe("Error Mapper", () => {
  describe("mapErrorCategory", () => {
    it("should map ApiClientError with 400 status to VERIFICATION_FAILED", () => {
      const error = new ApiClientError({
        code: "BAD_REQUEST",
        details: {},
        message: "Bad request",
        requestId: "req-123",
        status: 400
      });
      const category = mapErrorCategory(error);
      expect(category).toBe("VERIFICATION_FAILED");
    });

    it("should map ApiClientError with 408 status to VERIFICATION_TIMEOUT", () => {
      const error = new ApiClientError({
        code: "REQUEST_TIMEOUT",
        details: {},
        message: "Request timeout",
        requestId: "req-123",
        status: 408
      });
      const category = mapErrorCategory(error);
      expect(category).toBe("VERIFICATION_TIMEOUT");
    });

    it("should map ApiClientError with 500 status to VERIFICATION_FAILED", () => {
      const error = new ApiClientError({
        code: "INTERNAL_ERROR",
        details: {},
        message: "Internal error",
        requestId: "req-123",
        status: 500
      });
      const category = mapErrorCategory(error);
      expect(category).toBe("VERIFICATION_FAILED");
    });

    it("should map ApiClientError with 0 status (network error) to NETWORK_ERROR", () => {
      const error = new ApiClientError({
        code: "NETWORK_ERROR",
        details: {},
        message: "Network error",
        requestId: "req-123",
        status: 0
      });
      const category = mapErrorCategory(error);
      expect(category).toBe("NETWORK_ERROR");
    });

    it("should map ApiClientError with SIGNATURE code to INVALID_SIGNATURE", () => {
      const error = new ApiClientError({
        code: "INVALID_SIGNATURE",
        details: {},
        message: "Invalid signature",
        requestId: "req-123",
        status: 400
      });
      const category = mapErrorCategory(error);
      expect(category).toBe("INVALID_SIGNATURE");
    });

    it("should map standard Error with timeout message to VERIFICATION_TIMEOUT", () => {
      const error = new Error("Request timeout");
      const category = mapErrorCategory(error);
      expect(category).toBe("VERIFICATION_TIMEOUT");
    });

    it("should map standard Error with network message to NETWORK_ERROR", () => {
      const error = new Error("Network connection failed");
      const category = mapErrorCategory(error);
      expect(category).toBe("NETWORK_ERROR");
    });

    it("should map standard Error with signature message to INVALID_SIGNATURE", () => {
      const error = new Error("Invalid signature format");
      const category = mapErrorCategory(error);
      expect(category).toBe("INVALID_SIGNATURE");
    });

    it("should map TypeError with fetch message to NETWORK_ERROR", () => {
      const error = new TypeError("Failed to fetch");
      const category = mapErrorCategory(error);
      expect(category).toBe("NETWORK_ERROR");
    });

    it("should map unknown error to UNKNOWN_ERROR", () => {
      const error = new Error("Some random error");
      const category = mapErrorCategory(error);
      expect(category).toBe("UNKNOWN_ERROR");
    });

    it("should handle unknown error types gracefully", () => {
      const category = mapErrorCategory("string error");
      expect(category).toBe("UNKNOWN_ERROR");
    });

    it("should handle null error gracefully", () => {
      const category = mapErrorCategory(null);
      expect(category).toBe("UNKNOWN_ERROR");
    });
  });

  describe("mapWalletErrorCode", () => {
    it("should map rejection error to WALLET_REJECTED", () => {
      const code = mapWalletErrorCode("User rejected the request");
      expect(code).toBe("WALLET_REJECTED");
    });

    it("should map timeout error to WALLET_TIMEOUT", () => {
      const code = mapWalletErrorCode("Request timeout");
      expect(code).toBe("WALLET_TIMEOUT");
    });

    it("should map unavailable error to WALLET_UNAVAILABLE", () => {
      const code = mapWalletErrorCode("Wallet not found");
      expect(code).toBe("WALLET_UNAVAILABLE");
    });

    it("should map network mismatch error to WALLET_NETWORK_MISMATCH", () => {
      const code = mapWalletErrorCode("Network mismatch");
      expect(code).toBe("WALLET_NETWORK_MISMATCH");
    });

    it("should map signature error to SIGNATURE_INVALID", () => {
      const code = mapWalletErrorCode("Invalid signature");
      expect(code).toBe("SIGNATURE_INVALID");
    });

    it("should handle Error objects with wallet rejection", () => {
      const error = new Error("User rejected signature request");
      const code = mapWalletErrorCode(error);
      expect(code).toBe("WALLET_REJECTED");
    });

    it("should default to WALLET_UNAVAILABLE for unknown errors", () => {
      const code = mapWalletErrorCode("Unknown error");
      expect(code).toBe("WALLET_UNAVAILABLE");
    });

    it("should handle null/undefined gracefully", () => {
      expect(mapWalletErrorCode(null)).toBe("WALLET_UNAVAILABLE");
      expect(mapWalletErrorCode(undefined)).toBe("WALLET_UNAVAILABLE");
    });
  });
});
