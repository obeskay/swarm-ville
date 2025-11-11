# rendering Specification

## Purpose
TBD - created by archiving change add-pixi-theme-color-system. Update Purpose after archive.
## Requirements
### Requirement: Theme Color Access in PixiJS

The system SHALL provide a hook-based API for accessing CSS theme colors in PixiJS code, supporting all theme variables (primary, secondary, accent, destructive, muted, border, ring, sidebar, chart colors, and background) automatically converted to hexadecimal format.

#### Scenario: Light mode color access
- **WHEN** a component calls `useThemeColors()` in light mode
- **THEN** return hex colors matching light theme (e.g., `background: 0xf5f5f0`, `primary: 0x6b4423`)
- **AND** all 30+ theme colors from CSS variables are available
- **AND** colors are memoized to avoid repeated parsing

#### Scenario: Dark mode color access
- **WHEN** a component calls `useThemeColors()` in dark mode (`.dark` class on html)
- **THEN** return hex colors matching dark theme (e.g., `background: 0x443d3a`, `primary: 0xd4a574`)
- **AND** color names remain consistent between light and dark modes
- **AND** hook automatically detects theme based on DOM state

#### Scenario: Canvas background color
- **WHEN** PixiJS app initializes via `usePixiApp` hook
- **THEN** background color SHALL be read from theme colors (via `useThemeColors()`)
- **AND** initialization code SHALL log the detected background color to console
- **AND** background color SHALL match CSS `--background` variable converted to hex

### Requirement: OKLCH to Hexadecimal Conversion

The system SHALL convert OKLCH color format from CSS computed styles to hexadecimal format compatible with PixiJS.

#### Scenario: Standard OKLCH parsing
- **WHEN** a CSS variable contains OKLCH notation (e.g., `oklch(0.9818 0.0054 95.0986)`)
- **THEN** parse lightness, chroma, and hue components
- **AND** convert to approximate hexadecimal value
- **AND** log parsed and converted values to console for debugging

#### Scenario: Fallback for unknown formats
- **WHEN** a CSS variable value doesn't match expected OKLCH format
- **THEN** use pre-computed default mapping for that color
- **AND** log a warning to console indicating fallback usage

### Requirement: Dark Mode Awareness

The system SHALL detect and respond to dark mode changes via the `.dark` class on the `<html>` element.

#### Scenario: Light mode detection
- **WHEN** the `.dark` class is NOT present on `<html>`
- **THEN** use light theme colors in returned color object

#### Scenario: Dark mode detection
- **WHEN** the `.dark` class IS present on `<html>`
- **THEN** use dark theme colors in returned color object

### Requirement: Type Safety for Theme Colors

The system SHALL provide TypeScript types for theme color keys, ensuring compile-time safety when accessing colors.

#### Scenario: Typed color access
- **WHEN** a component uses `const colors = useThemeColors()`
- **THEN** `colors.primary` is valid and type-safe
- **AND** `colors.unknownColor` produces TypeScript error
- **AND** IDE autocomplete shows all available color names

### Requirement: Documentation for Theme Color Usage

The system SHALL provide clear documentation on how to use theme colors in PixiJS and game rendering code.

#### Scenario: Developer discovers theme colors
- **WHEN** a developer searches for "theme colors" or "PixiJS colors"
- **THEN** find `THEME_COLORS.md` guide in project documentation
- **AND** guide shows examples of using `useThemeColors()` in components
- **AND** guide lists all available color names and their CSS variable origins

