import { describe, it } from "vitest";
import { expectTypeOf } from "vitest";

import {
  healthSchema,
  versionSchema,
  readinessSchema,
  supportedSchema,
  sellerSchema,
  resourceSchema,
  paymentVerificationSchema,
  settlementSchema,
  receiptSchema,
  conformanceRunSchema,
  searchResultSchema
} from "./schemas";
import type * as Generated from "./client.generated";

describe("Schema Generated Type Alignment", () => {
  it("healthSchema output aligns with generated Health type", () => {
    expectTypeOf<ReturnType<typeof healthSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["Health"]
    >();
  });

  it("versionSchema output aligns with generated Version type", () => {
    expectTypeOf<ReturnType<typeof versionSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["Version"]
    >();
  });

  it("readinessSchema output aligns with generated Readiness type", () => {
    expectTypeOf<ReturnType<typeof readinessSchema.parse>>().toMatchTypeOf<
      Pick<Generated.components["schemas"]["Readiness"], "capabilities" | "environment" | "ok">
    >();
  });

  it("supportedSchema output aligns with generated SupportedPaymentSchemes type", () => {
    expectTypeOf<ReturnType<typeof supportedSchema.parse>>().toMatchTypeOf<
      Pick<Generated.components["schemas"]["SupportedPaymentSchemes"], "extensions" | "kinds">
    >();
  });

  it("sellerSchema output aligns with generated Seller type", () => {
    expectTypeOf<ReturnType<typeof sellerSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["Seller"]
    >();
  });

  it("resourceSchema output aligns with generated Resource type", () => {
    expectTypeOf<ReturnType<typeof resourceSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["Resource"]
    >();
  });

  it("paymentVerificationSchema output aligns with generated PaymentVerification type", () => {
    expectTypeOf<ReturnType<typeof paymentVerificationSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["PaymentVerification"]
    >();
  });

  it("settlementSchema output aligns with generated Settlement type", () => {
    expectTypeOf<ReturnType<typeof settlementSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["Settlement"]
    >();
  });

  it("receiptSchema output aligns with generated Receipt type", () => {
    expectTypeOf<ReturnType<typeof receiptSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["Receipt"]
    >();
  });

  it("conformanceRunSchema output aligns with generated ConformanceRun type", () => {
    expectTypeOf<ReturnType<typeof conformanceRunSchema.parse>>().toMatchTypeOf<
      Generated.components["schemas"]["ConformanceRun"]
    >();
  });

  it("searchResultSchema output aligns with generated SearchResult type", () => {
    expectTypeOf<ReturnType<typeof searchResultSchema.parse>>().toMatchTypeOf<
      Pick<
        Generated.components["schemas"]["SearchResult"],
        "nextCursor" | "partialResults" | "resources"
      >
    >();
  });
});
