# Theme Colors in PixiJS

This guide explains how to use CSS theme colors in PixiJS rendering code.

## Overview

The application uses a comprehensive theme color system based on CSS variables (OKLCH format). These colors are automatically converted to PixiJS-compatible hexadecimal values and are available through React hooks.

The system automatically supports both **light mode** and **dark mode** by detecting the `.dark` class on the `<html>` element.

## Quick Start

### Using the Hook

```typescript
import { useThemeColors } from '@/hooks/useThemeColors';

function MyGameComponent() {
  const colors = useThemeColors();

  // Use colors in PixiJS code
  const primaryColor = colors.primary; // e.g., 0x6b4423 (light) or 0xabab6f (dark)
  const bgColor = colors.background;  // e.g., 0xf5f5f0 (light) or 0x443d3a (dark)

  return <canvas ref={canvasRef} />;
}
```

### Single Color Hook

If you only need one color, use `useThemeColor`:

```typescript
import { useThemeColor } from '@/hooks/useThemeColors';

function Button() {
  const primaryColor = useThemeColor('primary');
  // Create button with primaryColor
}
```

## Available Colors

### Core Colors

| Key | Light Mode | Dark Mode | CSS Variable |
|-----|-----------|-----------|--------------|
| `background` | `#f5f5f0` | `#443d3a` | `--background` |
| `foreground` | `#3a3a3a` | `#ceaca2` | `--foreground` |
| `card` | `#f5f5f0` | `#443d3a` | `--card` |
| `cardForeground` | `#3a3a3a` | `#f5f5f0` | `--card-foreground` |
| `popover` | `#ffffff` | `#4f4642` | `--popover` |
| `popoverForeground` | `#443a34` | `#eae4df` | `--popover-foreground` |

### Interactive Colors

| Key | Light Mode | Dark Mode | CSS Variable | Usage |
|-----|-----------|-----------|--------------|-------|
| `primary` | `#6b4423` | `#abab6f` | `--primary` | Main action color, important buttons |
| `primaryForeground` | `#ffffff` | `#ffffff` | `--primary-foreground` | Text on primary background |
| `secondary` | `#ec9d6f` | `#f5f5f0` | `--secondary` | Secondary actions |
| `secondaryForeground` | `#6f503a` | `#4f4642` | `--secondary-foreground` | Text on secondary |
| `accent` | `#ec9d6f` | `#39322f` | `--accent` | Highlights, emphasis |
| `accentForeground` | `#443a34` | `#f7f5f3` | `--accent-foreground` | Text on accent |
| `destructive` | `#3a3a3a` | `#a26949` | `--destructive` | Delete, cancel, error states |
| `destructiveForeground` | `#ffffff` | `#ffffff` | `--destructive-foreground` | Text on destructive |
| `muted` | `#ede8e6` | `#39322f` | `--muted` | Disabled, inactive elements |
| `mutedForeground` | `#9a8f8a` | `#c4b5a8` | `--muted-foreground` | Text on muted |

### Structural Colors

| Key | Light Mode | Dark Mode | CSS Variable |
|-----|-----------|-----------|--------------|
| `border` | `#e3ddd9` | `#5c5349` | `--border` |
| `input` | `#c2bab5` | `#6f6359` | `--input` |
| `ring` | `#6b4423` | `#abab6f` | `--ring` |

### Data Visualization Colors

| Key | Light Mode | Dark Mode | CSS Variable |
|-----|-----------|-----------|--------------|
| `chart1` | `#8b6f47` | `#8b6f47` | `--chart-1` |
| `chart2` | `#b88bb9` | `#b088a7` | `--chart-2` |
| `chart3` | `#e8e8d0` | `#39322f` | `--chart-3` |
| `chart4` | `#d9c5a8` | `#4f4038` | `--chart-4` |
| `chart5` | `#8b6f47` | `#8b6f47` | `--chart-5` |

### Sidebar Colors

| Key | Light Mode | Dark Mode | CSS Variable |
|-----|-----------|-----------|--------------|
| `sidebar` | `#f7f5f3` | `#3d3530` | `--sidebar` |
| `sidebarForeground` | `#5f5551` | `#ceaca2` | `--sidebar-foreground` |
| `sidebarPrimary` | `#6b4423` | `#53443a` | `--sidebar-primary` |
| `sidebarPrimaryForeground` | `#fcfbfa` | `#fcfbfa` | `--sidebar-primary-foreground` |
| `sidebarAccent` | `#ec9d6f` | `#2b231c` | `--sidebar-accent` |
| `sidebarAccentForeground` | `#53443a` | `#ceaca2` | `--sidebar-accent-foreground` |
| `sidebarBorder` | `#f0ebe8` | `#f0ebe8` | `--sidebar-border` |
| `sidebarRing` | `#c4b5a8` | `#c4b5a8` | `--sidebar-ring` |

## Examples

### PixiJS Sprite Coloring

```typescript
import * as PIXI from 'pixi.js';
import { useThemeColors } from '@/hooks/useThemeColors';

function GameSprite() {
  const colors = useThemeColors();

  const sprite = new PIXI.Sprite(texture);
  sprite.tint = colors.primary; // Apply primary color tint
  return sprite;
}
```

### Dynamic Background

```typescript
function GameCanvas() {
  const colors = useThemeColors();
  const app = new PIXI.Application({
    backgroundColor: colors.background, // Responds to theme changes
  });
}
```

### Color-Coded UI Elements

```typescript
const elementColor = isError
  ? colors.destructive
  : isSuccess
    ? colors.primary
    : colors.muted;
```

### Accessibility: High Contrast Text

```typescript
const textColor = isDarkBackground
  ? colors.foreground // Light text on dark
  : colors.background; // Dark text on light
```

## Light Mode vs Dark Mode

Colors automatically switch based on the `.dark` class:

```typescript
// Light mode (default)
colors.primary // 0x6b4423 (brown)

// Dark mode (when html.classList.contains('dark'))
colors.primary // 0xabab6f (golden)
```

Theme switching is handled by `next-themes`. When the user changes theme, PixiJS components will automatically use the correct colors on next render.

## Implementation Details

### How It Works

1. **Hook Initialization**: `useThemeColors()` reads CSS variables from `document.documentElement`
2. **Mode Detection**: Checks for `.dark` class to determine light vs dark mode
3. **Color Mapping**: Pre-computed hex values stored in `ThemeColorHelper`
4. **Memoization**: Colors are memoized to avoid repeated parsing per render
5. **Type Safety**: TypeScript types ensure correct color key access

### OKLCH to Hex Conversion

The CSS variables are defined in OKLCH color space (precise perceptual uniformity), but are converted to RGB hex for PixiJS compatibility:

```css
/* CSS */
:root {
  --primary: oklch(0.6171 0.1375 39.0427);
}

/* Converted to PixiJS hex */
0x6b4423
```

## Debugging

### Check Detected Colors

Open the browser console and look for:

```
[ThemeColorHelper] Detected light mode
[ThemeColorHelper] Theme colors: {
  background: 0xf5f5f0,
  primary: 0x6b4423,
  ...
}
```

### Validation

```typescript
import { ThemeColorHelper } from '@/utils/theme-colors';

// Validate all theme colors are present
ThemeColorHelper.validateThemeColors(); // logs ✅ All required theme colors present
```

### Manual Color Check

```typescript
const colors = useThemeColors();
console.log('Primary:', `0x${colors.primary.toString(16).padStart(6, '0')}`);
```

## Best Practices

### ✅ Do

- Use `useThemeColors()` hook for color access
- Keep hardcoded colors only for PixiJS internal usage
- Test both light and dark modes
- Use semantic colors (primary, destructive) over literal colors

### ❌ Don't

- Hardcode hex colors in PixiJS code
- Use different color values in PixiJS vs CSS/HTML
- Forget to pass colors through the hook
- Assume light mode colors in dark mode

## Related Files

- **Theme Definition**: `src/index.css` (CSS variables)
- **Hook Implementation**: `src/hooks/useThemeColors.ts`
- **Color Helper**: `src/utils/theme-colors.ts`
- **PixiJS Integration**: `src/hooks/usePixiApp.ts`
- **Theme Provider**: `src/components/theme-provider.tsx` (next-themes setup)

## Troubleshooting

### Colors are black in dark mode

**Problem**: Colors not updating when switching to dark mode

**Solution**:
1. Verify `.dark` class is being added to `<html>` element
2. Check that `ThemeColorHelper.validateThemeColors()` passes
3. Ensure `useThemeColors()` is called in the component

### Console warnings about parsing

**Problem**: `[ThemeColorHelper] Failed to parse OKLCH` warnings

**Solution**:
- This is normal in development; colors fall back to pre-computed mappings
- Verify CSS variables are defined in `src/index.css`
- Check browser DevTools for computed styles on `<html>`

### Type errors for color keys

**Problem**: `Property 'invalidColor' does not exist on type 'ThemeColors'`

**Solution**:
- Check available color names in the Available Colors table above
- Use camelCase for multi-word colors: `cardForeground` not `card-foreground`
- Import `ThemeColorKey` type if defining custom color logic
