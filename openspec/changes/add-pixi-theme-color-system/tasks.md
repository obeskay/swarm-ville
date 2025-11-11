# Implementation Tasks: Add Dynamic Theme Color System to PixiJS

## 1. Core Utilities

- [ ] 1.1 Create `src/utils/theme-colors.ts` with `ThemeColorHelper` class
  - [ ] Parse OKLCH CSS values from computed styles
  - [ ] Map OKLCH values to hex approximations
  - [ ] Support both light and dark modes
  - [ ] Add type definitions for theme color keys
- [ ] 1.2 Create `src/hooks/useThemeColors.ts` hook
  - [ ] Read all CSS variables from theme
  - [ ] Return typed color object
  - [ ] Memoize to avoid repeated parsing
  - [ ] Support light/dark mode detection

## 2. Integration

- [ ] 2.1 Update `src/hooks/usePixiApp.ts` to use `useThemeColors()`
  - [ ] Replace hardcoded background color logic
  - [ ] Use new hook for `backgroundColor` setting
  - [ ] Add console logging for theme color detection
- [ ] 2.2 Update `src/components/space/SpaceContainer.tsx` if needed
  - [ ] Verify no color hardcoding conflicts

## 3. Documentation

- [ ] 3.1 Create `THEME_COLORS.md` guide
  - [ ] Explain available colors and their usage
  - [ ] Show examples of using `useThemeColors()` in components
  - [ ] Document color names matching CSS variables
  - [ ] Add dark mode behavior explanation
- [ ] 3.2 Add JSDoc comments to hook and utility
  - [ ] Document `ThemeColorHelper` methods
  - [ ] Document `useThemeColors` return type
  - [ ] Add usage examples

## 4. Testing & Validation

- [ ] 4.1 Manual testing: Light mode colors
  - [ ] Verify all colors read correctly
  - [ ] Confirm hex conversion matches CSS
  - [ ] Check console for parsing errors
- [ ] 4.2 Manual testing: Dark mode colors
  - [ ] Toggle `.dark` class on html element
  - [ ] Verify colors update correctly
  - [ ] Check accent colors in dark mode
- [ ] 4.3 Code review
  - [ ] No hardcoded colors in new code
  - [ ] Type safety throughout
  - [ ] No performance regressions

## 5. Deployment

- [ ] 5.1 Merge to main
- [ ] 5.2 Archive change (move to `openspec/archive/YYYY-MM-DD-add-pixi-theme-color-system/`)
- [ ] 5.3 Update `openspec/specs/rendering/spec.md` with final requirements
