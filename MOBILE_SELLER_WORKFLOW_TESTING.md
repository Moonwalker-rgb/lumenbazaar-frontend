# Mobile Seller Workflow Regression Suite

## Overview

This document describes the mobile regression test suite for seller workflows in LumenBazaar. The suite adds comprehensive Playwright coverage for mobile viewports (Pixel 7: 412×915px) to ensure seller creation, editing, verification, and publishing paths work seamlessly on mobile devices.

**Related Issue**: #96 - Add mobile seller workflow regression suite

## Test Coverage

### Test File

- Location: `tests/e2e/seller-mobile-workflow.spec.ts`
- Viewport: Pixel 7 (412×915px mobile device)
- Framework: Playwright with synthetic test data

### Workflows Covered

#### 1. Resource Creation Workflow

- **Basic Info Step**: Resource name, endpoint URL input
  - No horizontal overflow validation
  - Touch-safe input fields (≥40px height)
  - Form validation for required fields
  - Invalid URL detection

- **Pricing Step**: Pricing configuration
  - Form controls visibility
  - Touch-safe button sizing
  - Previous/Next navigation
  - Form control accessibility

- **Metadata Step**: Schema and metadata fields
  - Form rendering without overflow
  - Input schema field visibility
  - Form control accessibility

- **Integration Step**: Code snippets and integration examples
  - Code snippet readability on mobile
  - Scrollable content without horizontal overflow
  - Example navigation

- **Publish Step**: Publishing configuration
  - Publish form display without overflow
  - Safe defaults (no auto-publish)
  - Confirmation/validation before publish
  - All required fields visible

#### 2. Validation and Error Recovery

- Network error handling and recovery
- Form data persistence on navigation
- Clear error message display on mobile
- Validation error messaging

#### 3. Touch Interactions

- Rapid button tap handling
- Hover/active state visibility on mobile
- Form field tap targets (min 44×44px)
- Touch-friendly form submission

#### 4. Safe Defaults

- Resources not published by default
- "Save and exit" option prevents publishing
- Draft state preservation
- Clear draft option availability

#### 5. Desktop and Mobile Consistency

- Content structure parity
- Color contrast and accessibility
- Text input support
- No hover-only interactions

## Test Execution

### Running All Seller Mobile Tests

```bash
# Run mobile seller workflow tests
pnpm exec playwright test tests/e2e/seller-mobile-workflow.spec.ts --project=mobile

# Run against specific viewport
pnpm exec playwright test tests/e2e/seller-mobile-workflow.spec.ts --project=mobile --headed
```

### Running with Desktop Comparison

```bash
# Run on both desktop and mobile to verify consistency
pnpm exec playwright test tests/e2e/seller-mobile-workflow.spec.ts
```

### Test Validation Commands

```bash
# Type check
pnpm check

# Lint
pnpm lint

# All checks
pnpm check
```

## Acceptance Criteria Verification

### ✓ Every seller step is reachable without overflow

- Tests validate `scrollWidth <= clientWidth` for each step
- Basic Info, Pricing, Metadata, Integration, and Publish steps all tested
- Form inputs and buttons verified for visibility on 412px width

### ✓ Validation and recovery states are exercised

- Form validation errors tested for empty required fields
- Invalid URL validation tested
- Network error recovery scenario tested
- Form data persistence after navigation tested
- Error message visibility on mobile verified

### ✓ Tests do not publish live resources by default

- "Save and exit" button verified to not publish
- Safe defaults confirm resources remain in draft state
- Draft state preservation tested
- Publishing requires explicit action verification

### ✓ Responsive behavior verified

- No horizontal overflow on supported mobile viewports
- Touch-safe interaction sizing (40px+ buttons and inputs)
- Form controls accessible without scroll on mobile
- Content structure consistent between desktop and mobile

## Test Data

All tests use synthetic/example data:

- API names: "Test Weather API", "Mobile Test API", "Publish Test API"
- URLs: https://api.example.com/* (non-existent example domains)
- No production data or live resources used
- No secrets, seed phrases, or private keys in any test

## Security and Protocol Constraints

### Enforced in Tests

- Testnet-only validation
- No signed payloads in tests
- No private keys or seed phrases
- No production resource publishing
- Safe defaults prevent accidental publishing

### Not Tested (Out of Scope)

- Domain verification workflow (covered separately)
- Resource editing for existing resources
- Asset trust verification on seller side
- Protocol-level payment validations

## Running Verification

### Pre-PR Validation

```bash
# 1. Type checking and linting
pnpm check

# 2. Run mobile workflow tests
pnpm exec playwright test tests/e2e/seller-mobile-workflow.spec.ts --project=mobile

# 3. Run both desktop and mobile to verify consistency
pnpm exec playwright test tests/e2e/seller-mobile-workflow.spec.ts
```

### CI/CD Integration

Tests run automatically in CI pipelines:

- Desktop Chrome project
- Mobile Pixel 7 project

Both viewports ensure responsive behavior is maintained.

## Debugging Tests

### View Test Traces

```bash
# Run with headed browser for debugging
pnpm exec playwright test tests/e2e/seller-mobile-workflow.spec.ts --project=mobile --headed

# View trace from failed test
pnpm exec playwright show-trace trace.zip
```

### Test Debugging Tips

- Tests use `timeout: 5000` for visibility checks to allow for async renders
- Horizontal overflow checked via `scrollWidth <= clientWidth`
- Touch target sizes checked for minimum 40px height (44px recommended, allowing 4px variance)
- Mobile viewport: Pixel 7 at 412×915px (already set in playwright.config.ts)

## Documentation Updates

This document serves as the validation evidence for:

- Acceptance criterion: "Every seller step is reachable without overflow"
- Acceptance criterion: "Validation and recovery states are exercised"
- Acceptance criterion: "Tests do not publish live resources by default"
- Acceptance criterion: "Responsive behavior verified for visible changes"

## Test Maintenance

### When to Update Tests

- When new seller workflow steps are added
- When seller components receive responsive updates
- When mobile viewport requirements change
- When error handling flows change

### Test Stability

Tests are designed to be:

- **Resilient**: Use role-based selectors which are more stable than className selectors
- **Clear**: Explicit visibility checks before interactions
- **Safe**: No state pollution between tests via `test.beforeEach` cleanup
- **Isolated**: Synthetic data ensures test independence

## Future Enhancements

Potential future test additions:

- Resource editing workflow on mobile
- Domain verification workflow mobile tests
- Asset trust verification mobile tests
- Batch operations on mobile
- Performance testing for mobile form interactions
