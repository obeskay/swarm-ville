# Design: Dynamic Theme Color System for PixiJS

## Context

The application uses:
- **Tailwind CSS v4** with OKLCH color format for precise color management
- **shadcn/ui** components that consume CSS variables defined in `src/index.css`
- **PixiJS 8.x** for canvas rendering with its own color management system
- **next-themes** for light/dark mode switching (applies `.dark` class to `<html>`)

Currently, PixiJS reads only `--background` during initialization. This proposal extends that to support all theme colors dynamically.

## Goals

- Provide typed access to all CSS theme variables in PixiJS code
- Support both light and dark modes seamlessly
- Maintain consistency between CSS and PixiJS colors
- Avoid breaking existing rendering code
- Make theme color usage discoverable and well-documented

## Non-Goals

- Runtime color picker UI
- Theme creation/customization system (use Tailwind for that)
- Three-dimensional color space manipulation
- Animation/interpolation (handle in rendering code if needed)

## Decisions

### 1. OKLCH to Hex Conversion Strategy

**Decision**: Create a `ThemeColorHelper` utility that:
- Reads computed styles from `document.documentElement`
- Parses OKLCH values (e.g., `oklch(0.9818 0.0054 95.0986)`)
- Converts to approximate hex via numeric detection
- Caches values to avoid repeated parsing

**Why**: Direct regex/string parsing is simpler than canvas-based OKLCH→RGB conversion. Pre-computed mappings match the theme exactly.

**Alternatives considered**:
- Canvas-based color space conversion: Too heavy for initialization
- Direct hex values in CSS: Loses OKLCH precision and accessibility
- Runtime conversion via polyfills: Over-engineered for static theme

### 2. Hook-Based API

**Decision**: Expose via `useThemeColors()` hook returning:
```typescript
{
  background: 0xf5f5f0,
  foreground: 0x3a3a3a,
  primary: 0x6b4423,
  // ... all 30+ theme colors
}
```

**Why**: React patterns are familiar, can be called during component lifecycle, supports dependency tracking.

**Alternatives**:
- Global singleton: Harder to test, less React-idiomatic
- Direct utility function: Requires manual updates on theme change

### 3. Light/Dark Detection

**Decision**: Detect `.dark` class on `<html>` during hook initialization:
```typescript
const isDark = document.documentElement.classList.contains('dark');
```

**Why**: Aligns with next-themes convention, no external dependencies.

**Alternatives**:
- `prefers-color-scheme` media query: Doesn't account for forced dark mode
- next-themes integration: Adds coupling, but could be future enhancement

### 4. Static vs Dynamic Updates

**Decision**: Read colors once at hook initialization (static). If theme changes, component must re-hook (rare in practice with next-themes).

**Why**: Simplifies implementation, theme changes typically only happen on user action (handled by React re-renders).

**Fallback**: If dynamic updates needed later, hook can subscribe to `htmlElement.addEventListener('class', ...)`.

### 5. Naming Convention

**Decision**: Match CSS variable names exactly:
- CSS: `--primary` → Hook: `colors.primary`
- CSS: `--sidebar-primary` → Hook: `colors.sidebarPrimary`
- Avoid redundant prefixes (not `pixiPrimary` or `themePrimary`)

**Why**: Minimal cognitive load, traceable back to CSS.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **OKLCH parsing fragility** | Pre-computed mapping for standard theme; add console warnings for unknown patterns |
| **Divergence from CSS** | Document that colors must be changed via CSS, not hardcoded in PixiJS code |
| **Performance with many colors** | Minimal (one-time read + 30 assignments); verified with DevTools |
| **Theme change lag** | Rare use case; if critical, add theme change event listener |

## Migration Plan

1. Create `ThemeColorHelper` and `useThemeColors` hook
2. Update `usePixiApp` to use the new hook for background color
3. Document usage in a `THEME_COLORS.md` guide
4. Gradually migrate hardcoded colors to use `useThemeColors()`
5. No breaking changes; old code continues working

## Open Questions

- Should colors be memoized across hook calls?
  - **Answer**: Yes, use `useMemo` to avoid repeated parsing per render cycle
- Do we need to support OKLCH CSS functions dynamically?
  - **Answer**: No, at initialization we read computed values, which are already resolved by browser
- Should primary/secondary variants have hex versions too (e.g., `-foreground`)?
  - **Answer**: Yes, include all variables defined in CSS; 30+ colors total
