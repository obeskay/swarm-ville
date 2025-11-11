# Add Dynamic Theme Color System to PixiJS

## Why

Currently, PixiJS only has access to the `--background` CSS variable for the canvas background. This limits the ability to dynamically apply theme colors (primary, secondary, accent, destructive, etc.) to game elements, UI overlays, and visual effects. A comprehensive theme color system would allow:

- Game elements (characters, UI, effects) to automatically respond to theme changes
- Consistent color scheme across PixiJS and shadcn/ui components
- Easy theme switching without hardcoding color values
- Better separation of concerns between styling and rendering logic

## What Changes

- Extend `usePixiApp` hook to read all CSS theme variables (primary, secondary, accent, destructive, muted, border, ring, chart colors, sidebar colors)
- Create a `ThemeColorHelper` utility to convert OKLCH CSS values to PixiJS-compatible hex colors
- Create a `useThemeColors` hook that provides typed access to all theme colors with automatic light/dark mode support
- Document how to use theme colors in PixiJS rendering code
- Support dynamic theme switching without canvas recreation

## Impact

- Affected specs: `rendering` capability
- Affected code: `src/hooks/usePixiApp.ts`, new `src/utils/theme-colors.ts`, components using PixiJS colors
- Breaking changes: None
- Performance: Minimal (read operations on computed styles during initialization)
