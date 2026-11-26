# Performance Budgets

This document describes the performance budget system for LumenBazaar Frontend, which tracks and enforces limits on route bundle sizes and user-centric metrics to prevent regressions.

## Overview

Performance budgets are maximum acceptable values for:

- **Bundle Size (Uncompressed)**: Total JavaScript sent for a route
- **Compressed Size (Gzipped)**: Same bundle gzipped for network transfer
- **User-Centric Timings**: Largest Contentful Paint (LCP), First Input Delay (FID), Cumulative Layout Shift (CLS)

Budgets are versioned, explicitly documented, and enforced in CI. Any intentional increase requires deliberate review and an explicit update command.

## Current Budgets

All budgets are defined in `performance-budgets.json` at the repository root. Key thresholds:

### Bundle Sizes (by route)

- **Home (`/`)**: 450 KB uncompressed / 120 KB gzipped
- **Explore (`/explore`)**: 520 KB / 140 KB
- **Compare (`/explore/compare`)**: 580 KB / 155 KB
- **Seller Workflows**: 520–550 KB / 140–145 KB
- **Others**: 460–510 KB / 120–138 KB

### User-Centric Timings (Core Web Vitals)

- **LCP**: 2500 ms (2800 ms for comparison and form-heavy routes)
- **FID**: 100 ms
- **CLS**: 0.1

## Checking Budgets Locally

To validate the current build against budgets:

```bash
pnpm performance:check
```

This command:

1. Analyzes the `.next` build directory
2. Extracts bundle sizes for each route
3. Compares against `performance-budgets.json`
4. Reports size deltas and status (✅ ok, ⚠️ exceeded, 📦 new)

Example output:

```
=== Performance Budget Report ===

✅ /
   Bundle: 445 KB (4 KB decrease)
   Gzip:   118 KB (2 KB decrease)

❌ /explore
   Bundle: 530 KB (10 KB increase)
   Gzip:   145 KB (5 KB increase)
   ⚠️  Bundle size exceeded by 10 KB
   ⚠️  Gzip size exceeded by 5 KB

✅ /explore/compare
   Bundle: 575 KB (5 KB decrease)
   Gzip:   153 KB (2 KB decrease)
```

## Updating Budgets

When legitimate work increases a route's size, update budgets explicitly:

```bash
pnpm performance:update-budgets
```

This command:

1. Reads the current `.next` build
2. Updates all route budgets in `performance-budgets.json` to current values
3. Writes the updated file with a fresh timestamp

**Important**: This is an intentional action that should be part of a reviewed commit. Before updating, ensure:

- The size increase is necessary and justified
- Related code changes are reviewed
- You understand the impact on user experience
- CI performance checks pass

## Integration with CI

Performance budgets are validated in GitHub Actions during `pnpm check`:

```yaml
- name: Validate performance budgets
  run: pnpm performance:check
```

**CI Behavior**:

- ✅ All routes within budgets → CI passes
- ❌ Any route exceeds budget → CI fails
- 📦 New routes detected → Reported as informational (not a failure)

To unblock a PR with size increases:

1. Review the bundle size deltas
2. Confirm the increase is necessary
3. Run `pnpm performance:update-budgets` locally
4. Commit the updated `performance-budgets.json`
5. Push to update the PR

## Understanding Bundle Sizes

Bundle sizes are measured from the Next.js build manifest:

- **Uncompressed**: Raw JavaScript/CSS file sizes
- **Gzipped (Compressed)**: Estimated network transfer size
  - Rough heuristic: ≈30% of uncompressed size
  - Actual transfer size depends on server compression, browser caching, and other factors

### Why Bundle Size Matters

Larger bundles:

- Increase time to interactive (worse LCP)
- Increase memory usage on low-end devices
- Reduce caching efficiency
- Impact battery life on mobile

## Best Practices

### Keep Bundles Lean

- Split routes with large dependencies into separate chunks
- Use dynamic imports for non-critical features
- Audit dependencies: `pnpm audit:prod`

### Review Before Increasing

Always check if size increase is avoidable:

```bash
# Build and analyze
pnpm build

# Check what changed
pnpm performance:check

# If increases are necessary, review the code change first
# Then update budgets
pnpm performance:update-budgets
```

### Measure Real Performance

Budgets are indicators, not guarantees. For user-centric metrics:

- Use Chrome DevTools Lighthouse
- Test on low-end devices (throttled connections)
- Monitor production RUM (Real User Monitoring) data
- Verify Core Web Vitals in Search Console

## Routes Tracked

The following routes are monitored:

| Route                    | Purpose              |
| ------------------------ | -------------------- |
| `/`                      | Home / landing       |
| `/explore`               | Resource discovery   |
| `/explore/compare`       | Compare resources    |
| `/operators`             | Operator management  |
| `/operators/conformance` | Conformance status   |
| `/operators/health`      | Health monitoring    |
| `/receipts`              | Receipt history      |
| `/resources`             | Resource details     |
| `/seller`                | Seller dashboard     |
| `/seller/new-resource`   | Resource creation    |
| `/seller/payments`       | Payment management   |
| `/seller/resources`      | Seller's resources   |
| `/settings`              | User settings        |
| `/transactions`          | Transaction history  |
| `/playground`            | Developer playground |
| `/docs`                  | Documentation        |

## Troubleshooting

### Build artifacts not found

```
Error: .next build directory not found. Run "pnpm build" first.
```

Solution: Run `pnpm build` before checking budgets.

### Budget exceeded in CI

1. Check the delta report from `pnpm performance:check`
2. Identify the changed code that increased bundle size
3. Consider alternatives (lazy loading, code splitting, dependency cleanup)
4. If increase is justified, update budgets via `pnpm performance:update-budgets`

### New routes appear

When a new route is added, it will appear in performance reports as 📦 new. Update budgets to include it:

```bash
pnpm performance:update-budgets
```

## Future Enhancements

Planned improvements:

- **Rendering Performance**: Measure LCP, FID, CLS via Playwright tests
- **Mobile Simulation**: Detect regressions under 4G throttling
- **Historical Tracking**: Store metrics across builds to detect trends
- **Budget Alerts**: Optional notifications for approaching thresholds
- **Per-Component Analysis**: Break down bundle sizes by component

## Related Documentation

- [Next.js Build Analysis](https://nextjs.org/docs/advanced-features/analyzing-bundles)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analysis Best Practices](https://web.dev/bundlesize/)
