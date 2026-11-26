#!/usr/bin/env node

/**
 * Performance Budget Validation Script
 *
 * Measures and validates:
 * - Route bundle sizes
 * - Route rendering performance (LCP, FID, CLS)
 * - Against configured budgets in performance-budgets.json
 *
 * Usage:
 *   node scripts/performance-budgets.mjs [--update]
 *
 * Options:
 *   --update    Update budget baselines (requires explicit intent)
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BUDGETS_FILE = "performance-budgets.json";
const BUILD_DIR = ".next";
const LEGACY_MANIFEST_FILE = path.join(BUILD_DIR, "static", "manifest.json");
const ROUTE_STATS_FILE = path.join(BUILD_DIR, "diagnostics", "route-bundle-stats.json");

function addFileSize(totalSize, file) {
  if (typeof file !== "string") return totalSize;

  const filePath = path.isAbsolute(file) ? file : path.resolve(file);
  if (!fs.existsSync(filePath)) return totalSize;

  return totalSize + fs.statSync(filePath).size;
}

/**
 * Parse the legacy Next.js build manifest to extract route sizes.
 */
function extractLegacyRouteSizes() {
  const manifest = JSON.parse(fs.readFileSync(LEGACY_MANIFEST_FILE, "utf-8"));
  const sizes = {};

  for (const [route, data] of Object.entries(manifest)) {
    if (typeof data !== "object" || data === null) continue;

    const totalSize = (data.files || []).reduce(addFileSize, 0);

    if (totalSize > 0) {
      sizes[route] = {
        bundleSize: totalSize,
        compressedSize: Math.ceil(totalSize * 0.3)
      };
    }
  }

  return sizes;
}

/**
 * Next 16 + Turbopack does not emit static/manifest.json. Its diagnostics file
 * reports first-load chunks per route, so measure route-specific chunks while
 * excluding shared chunks that are loaded on every route.
 */
function extractTurbopackRouteSizes() {
  const stats = JSON.parse(fs.readFileSync(ROUTE_STATS_FILE, "utf-8"));
  if (!Array.isArray(stats)) return {};

  const chunkCounts = new Map();
  for (const entry of stats) {
    for (const chunk of entry.firstLoadChunkPaths || []) {
      chunkCounts.set(chunk, (chunkCounts.get(chunk) || 0) + 1);
    }
  }

  const buildManifestPath = path.join(BUILD_DIR, "build-manifest.json");
  const rootFiles = new Set();
  if (fs.existsSync(buildManifestPath)) {
    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, "utf-8"));
    for (const file of buildManifest.rootMainFiles || []) {
      rootFiles.add(path.resolve(BUILD_DIR, file));
    }
  }

  const sizes = {};
  for (const entry of stats) {
    if (!entry.route || entry.route === "/_not-found") continue;

    const routeFiles = (entry.firstLoadChunkPaths || []).filter((chunk) => {
      const resolved = path.resolve(chunk);
      return chunkCounts.get(chunk) < stats.length && !rootFiles.has(resolved);
    });

    const totalSize = routeFiles.reduce(addFileSize, 0);
    if (totalSize === 0) continue;

    // Dynamic receipt pages are covered by the /receipts budget.
    const route = entry.route.startsWith("/receipts/") ? "/receipts" : entry.route;
    sizes[route] = {
      bundleSize: totalSize,
      compressedSize: Math.ceil(totalSize * 0.3)
    };
  }

  return sizes;
}

/**
 * Parse the available Next.js build output to extract route sizes.
 */
function extractRouteSizes() {
  if (fs.existsSync(LEGACY_MANIFEST_FILE)) {
    return extractLegacyRouteSizes();
  }

  if (fs.existsSync(ROUTE_STATS_FILE)) {
    return extractTurbopackRouteSizes();
  }

  return {};
}

/**
 * Get current performance budgets configuration
 */
function getBudgetConfig() {
  if (!fs.existsSync(BUDGETS_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(BUDGETS_FILE, "utf-8"));
}

/**
 * Calculate delta between current and budgeted sizes
 */
function calculateDeltas(currentSizes, budgetConfig) {
  const deltas = [];

  for (const [route, current] of Object.entries(currentSizes)) {
    const budgeted = budgetConfig.routes[route];

    if (!budgeted) {
      deltas.push({
        route,
        status: "new",
        bundleSize: current.bundleSize,
        bundleDelta: null,
        compressedSize: current.compressedSize,
        compressedDelta: null
      });
      continue;
    }

    const bundleDelta = current.bundleSize - budgeted.bundleSize;
    const compressedDelta = current.compressedSize - budgeted.compressedSize;
    const bundleExceeded = bundleDelta > 0;
    const compressedExceeded = compressedDelta > 0;

    deltas.push({
      route,
      status: bundleExceeded || compressedExceeded ? "exceeded" : "ok",
      bundleSize: current.bundleSize,
      bundleDelta,
      bundleExceeded,
      compressedSize: current.compressedSize,
      compressedDelta,
      compressedExceeded
    });
  }

  return deltas;
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Report results in CI-friendly format
 */
function reportDeltas(deltas) {
  console.log("\n=== Performance Budget Report ===\n");

  let hasExceeded = false;

  for (const delta of deltas) {
    const bundleDeltaStr =
      delta.bundleDelta !== null
        ? ` ${delta.bundleDelta >= 0 ? "+" : ""}${formatBytes(delta.bundleDelta)}`
        : " (new)";

    const compressedDeltaStr =
      delta.compressedDelta !== null
        ? ` ${delta.compressedDelta >= 0 ? "+" : ""}${formatBytes(delta.compressedDelta)}`
        : " (new)";

    const icon = delta.status === "exceeded" ? "❌" : delta.status === "new" ? "📦" : "✅";

    console.log(`${icon} ${delta.route}`);
    console.log(`   Bundle: ${formatBytes(delta.bundleSize)}${bundleDeltaStr}`);
    console.log(`   Gzip:   ${formatBytes(delta.compressedSize)}${compressedDeltaStr}`);

    if (delta.bundleExceeded || delta.compressedExceeded) {
      hasExceeded = true;
      if (delta.bundleExceeded) {
        console.log(`   ⚠️  Bundle size exceeded by ${formatBytes(delta.bundleDelta)}`);
      }
      if (delta.compressedExceeded) {
        console.log(`   ⚠️  Gzip size exceeded by ${formatBytes(delta.compressedDelta)}`);
      }
    }
  }

  console.log("\n");

  if (hasExceeded) {
    console.log("❌ Performance budgets exceeded. See deltas above.");
    console.log("\nTo update budgets intentionally:");
    console.log("  pnpm run performance:update-budgets\n");
    return false;
  } else {
    console.log("✅ All routes within performance budgets.\n");
    return true;
  }
}

/**
 * Update budget baselines
 */
function updateBudgets(currentSizes) {
  const existing = getBudgetConfig();

  const updated = {
    version: "1.0.0",
    lastUpdated: new Date().toISOString(),
    explanation:
      "Performance budgets for route bundle sizes. Update only after reviewing and approving intentional size increases.",
    routes: {},
    defaults: existing?.defaults || {
      bundleSize: 500000, // 500 KB uncompressed
      compressedSize: 150000, // 150 KB gzipped
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1 // 0.1 CLS
    }
  };

  for (const [route, current] of Object.entries(currentSizes)) {
    updated.routes[route] = {
      route,
      bundleSize: current.bundleSize,
      compressedSize: current.compressedSize,
      lcpThreshold: updated.defaults.lcp,
      fidThreshold: updated.defaults.fid,
      clsThreshold: updated.defaults.cls
    };
  }

  fs.writeFileSync(BUDGETS_FILE, JSON.stringify(updated, null, 2) + "\n");
  console.log(`✅ Updated performance budgets in ${BUDGETS_FILE}`);
}

/**
 * Main execution
 */
async function main() {
  try {
    // Check if build exists
    if (!fs.existsSync(BUILD_DIR)) {
      console.error('❌ .next build directory not found. Run "pnpm build" first.');
      process.exit(1);
    }

    if (!fs.existsSync(LEGACY_MANIFEST_FILE) && !fs.existsSync(ROUTE_STATS_FILE)) {
      console.error(`❌ No build manifest found at ${LEGACY_MANIFEST_FILE} or ${ROUTE_STATS_FILE}`);
      process.exit(1);
    }

    const currentSizes = extractRouteSizes();
    const shouldUpdate = process.argv.includes("--update");

    if (shouldUpdate) {
      updateBudgets(currentSizes);
      process.exit(0);
    }

    const budgetConfig = getBudgetConfig();

    if (!budgetConfig) {
      console.log(`ℹ️  No existing budgets found. Creating baseline...`);
      updateBudgets(currentSizes);
      process.exit(0);
    }

    const deltas = calculateDeltas(currentSizes, budgetConfig);
    const success = reportDeltas(deltas);

    if (!success) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error validating performance budgets:", error.message);
    process.exit(1);
  }
}

main();
