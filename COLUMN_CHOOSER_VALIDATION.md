# Column Chooser Feature - Validation & Testing Guide

## Feature Overview

This document provides comprehensive validation procedures for the responsive table column chooser feature implemented in LumenBazaar frontend (Issue #95).

## Implementation Summary

### New Files Created

1. **`src/services/column-preferences.ts`** - Core service for managing column visibility preferences in localStorage
2. **`src/services/column-preferences.test.ts`** - Unit tests for column preferences (35+ test cases)
3. **`src/components/ui/column-chooser.tsx`** - Reusable column visibility dropdown component
4. **`src/components/ui/column-chooser.test.tsx`** - Component tests (40+ test cases)

### Modified Files

1. **`src/components/operators/operator-health-table.tsx`** - Integrated ColumnChooser with 4 columns (Service, Status, Last check, Reason)
2. **`src/components/transactions/transaction-dashboard.tsx`** - Integrated ColumnChooser with 8 columns (Attempt, Seller, Resource, Status, Amount, Created, Failure, Evidence)

## Key Features Implemented

### ✅ Required-Column Safeguards

- **Operator Health Table**: Service and Status columns are always visible and cannot be hidden
- **Transaction Dashboard**: Attempt and Status columns are always visible and cannot be hidden
- UI prevents user interaction with required columns (disabled state, visual feedback)
- Backend validation throws errors if required columns are attempted to be hidden

### ✅ Local Preferences (localStorage)

- Preferences stored under key: `lumenbazaar.frontend.column-preferences.v1`
- Persists across browser sessions
- Automatically loads on component mount
- Handles schema changes gracefully (filters out removed columns)
- Separate preferences for each table (by `tableId`)

### ✅ Accessibility Features

- Full ARIA support: `aria-haspopup`, `aria-expanded`, `aria-checked`, `role="menu"`
- Keyboard navigation: Escape to close menu, Tab/Shift+Tab to navigate
- Focus management: Focus returns to button when menu closes
- Visual indicators: Checkmarks, badges for required columns, hidden count badge
- Semantic HTML: Uses `<button>`, `<input>` with proper labeling
- Color contrast compliance: All text meets WCAG AA standards

### ✅ Responsive Design

- **Desktop**: Full menu with all options visible
- **Mobile (< 640px)**: Menu positioned and sized appropriately
- **Trigger Button**:
  - Desktop: Displays "Columns" + count badge (if hidden)
  - Mobile: Same, with responsive spacing using Tailwind `sm:` breakpoints
- **Menu Positioning**: Absolutely positioned (right-aligned) to stay within viewport
- **Touch-Friendly**: 44px minimum touch target size (Tailwind `min-h-9`)

### ✅ Mobile Keyboard Behavior

- **Click Outside Detection**: Menu closes when clicking outside (works on touch devices via mousedown)
- **Escape Key**: Menu closes and focus returns to button
- **Tab Navigation**: Users can tab through menu items on keyboard
- **Touch Support**: All buttons and checkboxes are touch-friendly sized
- **No Hover Dependencies**: Interactive elements work without hover (e.g., reset button remains visible)

## Validation Procedures

### 1. Desktop Behavior Testing

#### Operator Health Table (`/operators`)

```
Steps:
1. Open page in desktop browser (Chrome, Firefox, Safari, Edge)
2. Click "Columns" button in Service checks card header
3. Verify dropdown appears with 4 options:
   - Service (required, disabled, has "Required" badge)
   - Status (required, disabled, has "Required" badge)
   - Last check (optional, clickable)
   - Reason (optional, clickable)
4. Click "Last check" checkbox to hide column
5. Verify "Last check" column is removed from table
6. Verify column count badge shows "1" on the button
7. Click "Reset to default" button
8. Verify all columns reappear
9. Close menu by pressing Escape key
10. Verify focus returns to "Columns" button
11. Refresh page
12. Verify hidden column preference persists

Expected Results:
✓ All columns render correctly initially
✓ Required columns are properly disabled
✓ Column toggling works smoothly
✓ Badge shows accurate count
✓ Reset restores all columns
✓ Preferences persist across page reloads
```

#### Transaction Dashboard (`/transactions`)

```
Steps:
1. Open page in desktop browser
2. Locate "Payment activity" card with "Columns" button
3. Click "Columns" button to open menu
4. Verify 8 columns are listed:
   - Attempt (required, disabled)
   - Seller (optional)
   - Resource (optional)
   - Status (required, disabled)
   - Amount (optional)
   - Created (optional)
   - Failure (optional)
   - Evidence (optional)
5. Hide 3 optional columns: Seller, Amount, Evidence
6. Verify table now shows only: Attempt, Resource, Status, Created, Failure
7. Verify button shows "3" badge
8. Toggle "Seller" back on
9. Verify Seller column reappears in correct position
10. Reset all columns
11. Verify all 8 columns return
12. Navigate to next page using pagination
13. Verify column preferences persist across pages
14. Refresh page
15. Verify hidden columns remain hidden

Expected Results:
✓ All 8 columns initially visible
✓ Attempt and Status are disabled
✓ Hiding/showing works without affecting table structure
✓ Column order is preserved
✓ Preferences persist across pagination and page reloads
✓ Table remains responsive with varying column counts
```

### 2. Mobile Behavior Testing

#### Device Testing (iPhone SE 375px, iPhone 12 390px, Pixel 6 412px)

```
Steps:
1. Open `/operators` on mobile device or browser devtools mobile emulation
2. Verify "Columns" button is visible and properly sized (min 44px height)
3. Tap "Columns" button
4. Verify dropdown menu appears and is readable
5. Verify menu doesn't overflow screen edges
6. Tap "Last check" to hide column
7. Verify column disappears from table
8. Verify table remains scrollable with remaining columns
9. Tap "Columns" button again to open menu
10. Verify hidden count badge shows "1"
11. Tap "Reset to default"
12. Verify column reappears
13. Close menu by tapping outside menu area
14. Verify menu closes without errors
15. Scroll table horizontally to ensure overflow handling
16. Try opening menu again - verify it works consistently

Expected Results:
✓ Button is touch-friendly and properly sized
✓ Menu is readable and stays within viewport
✓ Column hiding works on mobile
✓ Table maintains horizontal scroll
✓ Click-outside detection works (via mousedown)
✓ No layout shifts or visual glitches
✓ Feature works consistently across different screen sizes
```

#### Keyboard Navigation on Mobile

```
Steps:
1. Open page on mobile with external keyboard connected (iPad with keyboard)
2. Tab to "Columns" button
3. Press Enter to open menu
4. Use Tab to navigate through column options
5. Press Space to toggle visibility
6. Use Shift+Tab to navigate backwards
7. Press Escape to close menu
8. Verify focus returns to "Columns" button

Expected Results:
✓ All keyboard navigation works
✓ Escape key properly closes menu
✓ Focus management works correctly
```

### 3. Browser Compatibility

```
Testing checklist across:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest version)

For each browser, verify:
1. Column chooser button appears
2. Menu opens/closes correctly
3. Column toggling works
4. Preferences persist
5. Keyboard navigation works
6. No console errors
```

### 4. Responsive Width Testing

#### Tablet (iPad, 768px width)

```
Expected Behavior:
- Menu button visible and functional
- Table columns adapt to available width
- Horizontal scroll works if needed
- Menu dropdown doesn't overflow
```

#### Large Desktop (1920px+ width)

```
Expected Behavior:
- All columns can potentially be visible
- Menu button in header area
- Table displays with proper spacing
- Export and Column buttons don't overlap
```

### 5. Edge Cases

#### localStorage Unavailability

```
Scenario: Private browsing mode (no localStorage)
Expected: Feature still works, preferences not persisted
- Component doesn't crash
- Column visibility toggles work
- On page reload, resets to all columns visible
```

#### Rapid Toggle Clicks

```
Scenario: User rapidly clicks column checkboxes
Expected:
- All clicks are processed
- Final state matches expected visibility
- No race conditions or state inconsistencies
```

#### Manual localStorage Corruption

```
Scenario: localStorage contains invalid JSON or schema
Expected:
- Application doesn't crash
- Loads all columns by default
- Can save new preferences successfully
```

#### Very Long Column Names

```
Scenario: Column labels are very long
Expected:
- Menu items don't overflow container
- Text is readable (ellipsis or wrapping)
- Checkbox remains properly positioned
```

## Performance Validation

### 1. Initial Load Time

- Measure: Time from component mount to menu appearing
- Expected: <100ms
- Testing: Use browser DevTools Performance tab

### 2. Toggle Response Time

- Measure: Time from checkbox click to column disappearing
- Expected: <50ms
- Testing: Visual inspection + DevTools Performance

### 3. localStorage Access

- Measure: Time to read/write preferences
- Expected: <10ms (synchronous)
- Testing: DevTools Performance tab

### 4. Memory Usage

- No memory leaks when toggling columns repeatedly
- Cleanup of event listeners on component unmount

## Accessibility Validation (WCAG 2.1 AA)

### Automated Testing

```bash
# Run Playwright accessibility tests
pnpm test:e2e:a11y
```

### Manual Accessibility Testing

1. **Screen Reader (NVDA, JAWS, VoiceOver)**
   - Menu button properly announced
   - Column options read with checked/unchecked state
   - Required columns clearly marked
   - Reset button announced correctly

2. **Keyboard Navigation**
   - All interactive elements reachable via Tab
   - No keyboard traps
   - Focus visible at all times
   - Escape key works as expected

3. **Color Contrast**
   - All text meets 4.5:1 ratio for normal text
   - Visual indicators don't rely solely on color

4. **Responsive Text**
   - 16px base font size on mobile
   - Text remains readable at 200% zoom

## Test Evidence Checklist

Before considering implementation complete, verify:

- [ ] OperatorHealthTable column chooser works on desktop
- [ ] TransactionDashboard column chooser works on desktop
- [ ] Required columns cannot be hidden
- [ ] Hidden count badge displays correctly
- [ ] Preferences persist across page reloads
- [ ] Menu closes on Escape and outside clicks
- [ ] Mobile responsiveness verified on actual devices or emulation
- [ ] Keyboard navigation works completely
- [ ] No console errors in any browser
- [ ] localStorage unavailability doesn't break feature
- [ ] All ARIA attributes present and correct
- [ ] No accessibility violations detected

## Documentation

### User Documentation

Users should understand:

1. How to click the "Columns" button to open the menu
2. That required columns (marked "Required") cannot be hidden
3. That their preferences are saved automatically
4. How to use "Reset to default" to restore all columns
5. That preferences are stored locally per browser

### Developer Documentation

Developers should understand:

1. How to add column chooser to new tables
2. How the localStorage schema works
3. How to define required vs optional columns
4. How the visibility state flows through components
5. How to handle SSR properly (hydration safety)

## Known Limitations

1. **Single Browser Storage**: Preferences don't sync across browsers
2. **Storage Limit**: localStorage has ~5-10MB limit (minimal impact for this feature)
3. **No Cloud Sync**: Preferences tied to device, not user account
4. **Menu Position**: Always right-aligned; potential overflow on very narrow screens (handled)

## Future Enhancements (Out of Scope)

- Sync preferences to user account (requires backend)
- Export/import column configurations
- Column reordering (drag-and-drop)
- Column resizing
- Column freezing (header lock)
- Profile-based column sets

## Deployment Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Code formatted with Prettier
- [ ] ESLint checks pass
- [ ] Branch created: `frontend/add-responsive-table-column-chooser`
- [ ] PR description includes validation evidence
- [ ] PR title clear and concise
- [ ] Closes #95 in PR description
- [ ] Desktop and mobile screenshots captured
- [ ] No uncommitted changes
- [ ] No secrets committed

---

**Last Updated**: November 2026
**Status**: Ready for Testing
**Issue**: #95 Add responsive table column chooser
