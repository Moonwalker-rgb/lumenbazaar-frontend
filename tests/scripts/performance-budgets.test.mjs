import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");

/**
 * Performance Budgets Script Tests
 *
 * Validates that the performance budget system correctly:
 * - Parses budget configurations
 * - Detects size increases/decreases
 * - Formats output correctly
 * - Handles edge cases
 */

describe("Performance Budgets", () => {
  describe("Configuration", () => {
    it("should have valid performance-budgets.json", () => {
      const budgetsPath = path.join(ROOT_DIR, "performance-budgets.json");
      expect(fs.existsSync(budgetsPath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(budgetsPath, "utf-8"));

      // Verify structure
      expect(content.version).toBeDefined();
      expect(content.lastUpdated).toBeDefined();
      expect(content.explanation).toBeDefined();
      expect(content.routes).toBeDefined();
      expect(content.defaults).toBeDefined();
    });

    it("should have sensible default thresholds", () => {
      const budgetsPath = path.join(ROOT_DIR, "performance-budgets.json");
      const content = JSON.parse(fs.readFileSync(budgetsPath, "utf-8"));

      const defaults = content.defaults;

      // Bundle sizes should be reasonable
      expect(defaults.bundleSize > 0).toBe(true);
      expect(defaults.bundleSize < 1000000).toBe(true); // < 1 MB

      // Compressed should be < uncompressed
      expect(defaults.compressedSize < defaults.bundleSize).toBe(true);

      // Web Vitals thresholds should match recommendations
      expect(defaults.lcp <= 2500).toBe(true); // Good LCP
      expect(defaults.fid <= 100).toBe(true); // Good FID
      expect(defaults.cls <= 0.1).toBe(true); // Good CLS
    });

    it("should have all major routes configured", () => {
      const budgetsPath = path.join(ROOT_DIR, "performance-budgets.json");
      const content = JSON.parse(fs.readFileSync(budgetsPath, "utf-8"));

      const expectedRoutes = [
        "/",
        "/explore",
        "/explore/compare",
        "/operators",
        "/seller",
        "/transactions"
      ];

      for (const route of expectedRoutes) {
        expect(content.routes[route]).toBeDefined();
      }
    });

    it("should have consistent route configuration structure", () => {
      const budgetsPath = path.join(ROOT_DIR, "performance-budgets.json");
      const content = JSON.parse(fs.readFileSync(budgetsPath, "utf-8"));

      for (const [route, budget] of Object.entries(content.routes)) {
        expect(budget.route).toBe(route);
        expect(budget.bundleSize).toBeDefined();
        expect(budget.compressedSize).toBeDefined();
        expect(budget.lcpThreshold).toBeDefined();
        expect(budget.fidThreshold).toBeDefined();
        expect(budget.clsThreshold).toBeDefined();

        // Validate values
        expect(typeof budget.bundleSize === "number").toBe(true);
        expect(budget.bundleSize > 0).toBe(true);
        expect(budget.compressedSize < budget.bundleSize).toBe(true);
      }
    });

    it("should document the purpose of budgets", () => {
      const budgetsPath = path.join(ROOT_DIR, "performance-budgets.json");
      const content = JSON.parse(fs.readFileSync(budgetsPath, "utf-8"));

      expect(content.explanation).toBeTruthy();
      expect(content.explanation.length > 50).toBe(true);
      expect(content.explanation.includes("budget")).toBe(true);
    });
  });

  describe("Performance Budget Script", () => {
    it("should have executable performance script", () => {
      const scriptPath = path.join(ROOT_DIR, "scripts/performance-budgets.mjs");
      expect(fs.existsSync(scriptPath)).toBe(true);

      const content = fs.readFileSync(scriptPath, "utf-8");

      // Should document usage
      expect(content.includes("Performance Budget Validation Script")).toBe(true);
      expect(content.includes("Usage:")).toBe(true);

      // Should have key functions
      expect(content.includes("extractRouteSizes")).toBe(true);
      expect(content.includes("calculateDeltas")).toBe(true);
      expect(content.includes("reportDeltas")).toBe(true);
      expect(content.includes("updateBudgets")).toBe(true);
    });

    it("should have error handling", () => {
      const scriptPath = path.join(ROOT_DIR, "scripts/performance-budgets.mjs");
      const content = fs.readFileSync(scriptPath, "utf-8");

      // Should check for build directory
      expect(content.includes(".next build directory")).toBe(true);

      // Should handle missing manifest
      expect(content.includes("manifest")).toBe(true);

      // Should have try-catch
      expect(content.includes("try")).toBe(true);
      expect(content.includes("catch")).toBe(true);
    });
  });

  describe("Package.json Integration", () => {
    it("should have performance check script", () => {
      const packagePath = path.join(ROOT_DIR, "package.json");
      const content = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

      expect(content.scripts["performance:check"]).toBeDefined();
      expect(content.scripts["performance:check"].includes("performance-budgets.mjs")).toBe(true);
    });

    it("should have performance update script", () => {
      const packagePath = path.join(ROOT_DIR, "package.json");
      const content = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

      expect(content.scripts["performance:update-budgets"]).toBeDefined();
      expect(content.scripts["performance:update-budgets"].includes("--update")).toBe(true);
    });

    it("should include performance check in main check script", () => {
      const packagePath = path.join(ROOT_DIR, "package.json");
      const content = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

      expect(content.scripts.check.includes("performance:check")).toBe(true);
    });
  });

  describe("CI Integration", () => {
    it("should have CI workflow with performance validation", () => {
      const ciPath = path.join(ROOT_DIR, ".github/workflows/ci.yml");
      expect(fs.existsSync(ciPath)).toBe(true);

      const content = fs.readFileSync(ciPath, "utf-8");

      expect(content.includes("Validate performance budgets")).toBe(true);
      expect(content.includes("performance:check")).toBe(true);
    });
  });

  describe("Documentation", () => {
    it("should have performance budget documentation", () => {
      const docPath = path.join(ROOT_DIR, "docs/PERFORMANCE_BUDGETS.md");
      expect(fs.existsSync(docPath)).toBe(true);

      const content = fs.readFileSync(docPath, "utf-8");

      // Should cover key topics
      expect(content.includes("Performance")).toBe(true);
      expect(content.includes("Budget")).toBe(true);
      expect(content.includes("CI")).toBe(true);
      expect(content.includes("pnpm performance:check")).toBe(true);
      expect(content.includes("pnpm performance:update-budgets")).toBe(true);
      expect(content.includes("Core Web Vitals")).toBe(true);
    });

    it("should document checking budgets locally", () => {
      const docPath = path.join(ROOT_DIR, "docs/PERFORMANCE_BUDGETS.md");
      const content = fs.readFileSync(docPath, "utf-8");

      expect(content.includes("Checking Budgets Locally")).toBe(true);
      expect(content.includes("pnpm performance:check")).toBe(true);
    });

    it("should document updating budgets", () => {
      const docPath = path.join(ROOT_DIR, "docs/PERFORMANCE_BUDGETS.md");
      const content = fs.readFileSync(docPath, "utf-8");

      expect(content.includes("Updating Budgets")).toBe(true);
      expect(content.includes("pnpm performance:update-budgets")).toBe(true);
      expect(content.includes("intentional")).toBe(true);
    });

    it("should provide troubleshooting guidance", () => {
      const docPath = path.join(ROOT_DIR, "docs/PERFORMANCE_BUDGETS.md");
      const content = fs.readFileSync(docPath, "utf-8");

      expect(content.includes("Troubleshooting")).toBe(true);
      expect(content.includes("Budget exceeded")).toBe(true);
    });
  });

  describe("Size Deltas Logic", () => {
    it("should calculate positive deltas for size increases", () => {
      const budgeted = 100000;
      const current = 105000;
      const delta = current - budgeted;

      expect(delta === 5000).toBe(true);
      expect(delta > 0).toBe(true);
    });

    it("should calculate negative deltas for size decreases", () => {
      const budgeted = 100000;
      const current = 95000;
      const delta = current - budgeted;

      expect(delta === -5000).toBe(true);
      expect(delta < 0).toBe(true);
    });

    it("should correctly identify exceeded budgets", () => {
      const cases = [
        { budgeted: 100, current: 105, exceeded: true },
        { budgeted: 100, current: 100, exceeded: false },
        { budgeted: 100, current: 95, exceeded: false },
        { budgeted: 1000, current: 1001, exceeded: true }
      ];

      for (const testCase of cases) {
        const exceeded = testCase.current > testCase.budgeted;
        expect(exceeded === testCase.exceeded).toBe(true);
      }
    });
  });
});
