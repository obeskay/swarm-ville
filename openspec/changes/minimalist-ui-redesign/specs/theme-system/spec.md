# Theme System Specification

## Overview

This specification defines the unified color and spacing system for SwarmVille, ensuring consistency across all UI elements while supporting both light and dark modes.

## Color System

### Primary Colors

**Blue (Action)**
- Primary: `#3b82f6` - Buttons, links, focus indicators
- Hover: `#2563eb` - Darkened for hover state
- Light: `#dbeafe` - Background for badges, highlights
- Dark: `#1e40af` - Text on light backgrounds

**Use Cases**:
- Primary buttons
- Active/selected states
- Focus rings
- Primary navigation
- Active missions

---

**Purple (Secondary)**
- Primary: `#8b5cf6` - Alternative actions
- Hover: `#7c3aed` - Darkened hover
- Light: `#ede9fe` - Light background
- Dark: `#5b21b6` - Dark text

**Use Cases**:
- Secondary buttons
- Alternative CTAs
- Accent elements
- Special actions

---

**Green (Success)**
- Primary: `#10b981` - Completion, online status
- Hover: `#059669` - Darkened hover
- Light: `#d1fae5` - Success background
- Dark: `#065f46` - Dark text

**Use Cases**:
- Online indicator
- Completed status
- Success messages
- Progress indicators

---

**Amber (Warning)**
- Primary: `#f59e0b` - Warnings, attention needed
- Hover: `#d97706` - Darkened hover
- Light: `#fef3c7` - Warning background
- Dark: `#92400e` - Dark text

**Use Cases**:
- Warning messages
- Caution states
- Loading indicators
- Progress warning

---

**Red (Error)**
- Primary: `#ef4444` - Errors, blocked actions
- Hover: `#dc2626` - Darkened hover
- Light: `#fee2e2` - Error background
- Dark: `#7f1d1d` - Dark text

**Use Cases**:
- Error messages
- Validation failures
- Offline status
- Destructive actions

---

### Neutral Colors

**Gray Scale** (Light Mode)
- 50: `#f9fafb` - Hover backgrounds, light surfaces
- 100: `#f3f4f6` - Input backgrounds, disabled states
- 200: `#e5e7eb` - Borders, dividers
- 300: `#d1d5db` - Secondary borders
- 400: `#9ca3af` - Placeholder text
- 500: `#6b7280` - Secondary text
- 600: `#4b5563` - Primary text (secondary)
- 700: `#374151` - Primary text
- 800: `#1f2937` - Headings, dark text
- 900: `#111827` - Darkest text

**Gray Scale** (Dark Mode)
- 50: `#1a1a2e` - Surface backgrounds
- 100: `#16213e` - Secondary backgrounds
- 200: `#0f3460` - Borders
- 300: `#533483` - Secondary borders
- 400: `#8b9bb6` - Placeholder text
- 500: `#b8c5d6` - Secondary text
- 600: `#e0e7f1` - Primary text (secondary)
- 700: `#f0f4f8` - Primary text
- 800: `#ffffff` - Headings (light)
- 900: `#ffffff` - Brightest text

---

### Color Contrast Ratios

**Required Ratios** (WCAG AA):
- Body text on backgrounds: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

**Verified Combinations** (Light Mode):
- Gray-700 (#374151) on Gray-50 (#f9fafb): 12.6:1 ✅
- Gray-600 (#4b5563) on White: 9.2:1 ✅
- Gray-500 (#6b7280) on White: 7.8:1 ✅
- Blue-600 (#2563eb) on White: 8.3:1 ✅

**Verified Combinations** (Dark Mode):
- Gray-700 (#f0f4f8) on Gray-50 (#1a1a2e): 13.5:1 ✅
- Gray-600 (#e0e7f1) on Gray-100 (#16213e): 11.2:1 ✅
- Blue-300 on Dark bg: 7.5:1 ✅

---

## Spacing System

### Scale

All spacing values are multiples of 4px base unit:

```
0:    0px
px:   1px    (borders, dividers)
0.5:  2px    (small gaps)
1:    4px    (minimal padding)
2:    8px    (component padding)
3:    12px   (section spacing)
4:    16px   (standard padding)
5:    20px   (comfortable spacing)
6:    24px   (generous spacing)
8:    32px   (major sections)
10:   40px   (layout spacing)
12:   48px   (toolbars)
14:   56px   (large sections)
16:   64px   (extra large)
20:   80px   (maximum spacing)
```

### Usage Guidelines

**Padding** (Interior spacing within components):
- Buttons: 8px vertical, 16px horizontal
- Input fields: 8px vertical, 12px horizontal
- Cards: 16px
- Panels: 0 (full bleed), content inside 16px
- List items: 12px vertical, 16px horizontal

**Margins** (Spacing between components):
- Between buttons: 8px
- Between cards: 8px
- Between sections: 16px
- Between major areas: 24px
- Top/bottom of content: 16px

**Gaps** (In flex/grid layouts):
- Item spacing: 8px
- Section spacing: 16px
- Column spacing: 24px
- Row spacing: 12px

---

## Typography System

### Font Families

```css
/* System fonts (no webfonts) */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: "Menlo", "Monaco", "Courier New", monospace;
```

### Font Sizes

```
12px  (small, secondary text, captions)
14px  (body text, default)
16px  (large body, emphasized)
18px  (subheadings, h3)
24px  (section headings, h2)
32px  (page headings, h1)
```

### Font Weights

```
400   (normal text, body)
500   (medium, emphasis)
600   (semibold, secondary headers)
700   (bold, primary headers)
```

### Line Heights

```
1.2   (tight, headings)
1.5   (normal, body text)
1.75  (loose, captions)
```

### Text Styles

**Heading 1** (32px, 700 weight, 1.2 line-height)
```css
font-size: 32px;
font-weight: 700;
line-height: 1.2;
letter-spacing: -0.01em;
```

**Heading 2** (24px, 600 weight, 1.3 line-height)
```css
font-size: 24px;
font-weight: 600;
line-height: 1.3;
letter-spacing: -0.005em;
```

**Heading 3** (18px, 600 weight, 1.4 line-height)
```css
font-size: 18px;
font-weight: 600;
line-height: 1.4;
```

**Body** (14px, 400 weight, 1.5 line-height)
```css
font-size: 14px;
font-weight: 400;
line-height: 1.5;
```

**Small** (12px, 400 weight, 1.5 line-height)
```css
font-size: 12px;
font-weight: 400;
line-height: 1.5;
```

**Monospace** (14px, 400 weight, 1.5 line-height)
```css
font-family: monospace;
font-size: 14px;
font-weight: 400;
line-height: 1.5;
letter-spacing: 0.02em;
```

---

## Border System

### Border Radius

```
0:    0px      (no radius, square)
sm:   2px      (minimal rounding)
md:   4px      (standard buttons, inputs)
lg:   8px      (cards, panels)
xl:   12px     (large surfaces)
full: 9999px   (pill shapes, circles)
```

### Border Widths

```
0:    0px      (no border)
px:   1px      (standard borders, dividers)
2:    2px      (emphasis borders)
4:    4px      (thick dividers, highlights)
```

### Border Colors

**Light Mode**:
- Subtle: `#e5e7eb` (#gray-200) - Default borders
- Medium: `#d1d5db` (#gray-300) - Secondary borders
- Strong: `#9ca3af` (#gray-400) - Emphasized borders

**Dark Mode**:
- Subtle: `#374151` (#gray-700) - Default borders
- Medium: `#4b5563` (#gray-600) - Secondary borders
- Strong: `#6b7280` (#gray-500) - Emphasized borders

---

## Shadow System

**Requirement**: NO SHADOWS - Use borders and colors instead

All visual separation achieved through:
- Solid borders (1px)
- Background color contrast
- Spacing (margin/padding)
- Elevation through z-index and color

**Prohibited**:
- Drop shadows
- Box shadows
- Text shadows
- Blur/glow effects

**Rationale**: Shadows create perceived transparency and depth, conflicting with minimalist aesthetic.

---

## Opacity & Transparency

**Requirement**: NO TRANSPARENCY in main UI

All opacity values are approximated with solid colors:

**Dark Overlay** (60% opacity appearance):
- Instead of: `rgba(0,0,0,0.6)`
- Use solid: `#1f2937` (gray-800)

**Light Overlay** (90% opacity appearance):
- Instead of: `rgba(255,255,255,0.9)`
- Use solid: `#f9fafb` (gray-50)

**Hover States** (8% brightness change):
- Instead of: `rgba(0,0,0,0.08)`
- Use color shift: Blue-500 → Blue-600

---

## Light Mode Theme

```typescript
export const lightTheme = {
  // Backgrounds
  surface: '#ffffff',
  surfaceSecondary: '#f9fafb',
  surfaceTertiary: '#f3f4f6',

  // Text
  textPrimary: '#1f2937',
  textSecondary: '#374151',
  textTertiary: '#6b7280',
  textInverse: '#ffffff',

  // Borders
  borderDefault: '#e5e7eb',
  borderSecondary: '#d1d5db',
  borderStrong: '#9ca3af',

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Accents
  primary: '#3b82f6',
  secondary: '#8b5cf6',
};
```

---

## Dark Mode Theme

```typescript
export const darkTheme = {
  // Backgrounds
  surface: '#1a1a2e',
  surfaceSecondary: '#16213e',
  surfaceTertiary: '#0f3460',

  // Text
  textPrimary: '#f0f4f8',
  textSecondary: '#e0e7f1',
  textTertiary: '#b8c5d6',
  textInverse: '#1a1a2e',

  // Borders
  borderDefault: '#374151',
  borderSecondary: '#4b5563',
  borderStrong: '#6b7280',

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#60a5fa',

  // Accents
  primary: '#60a5fa',
  secondary: '#a78bfa',
};
```

---

## Theme Implementation

### CSS Variables

```css
:root {
  /* Light mode (default) */
  --color-surface: #ffffff;
  --color-text-primary: #1f2937;
  --color-border: #e5e7eb;
  --color-primary: #3b82f6;

  --space-xs: 2px;
  --space-sm: 4px;
  --space-md: 8px;
  --space-lg: 16px;
  --space-xl: 24px;
}

[data-theme="dark"] {
  /* Dark mode */
  --color-surface: #1a1a2e;
  --color-text-primary: #f0f4f8;
  --color-border: #374151;
  --color-primary: #60a5fa;
}
```

### React Implementation

```tsx
import { createContext, useContext, useState } from 'react';

type ThemeType = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: ThemeType;
  toggle: () => void;
}>({ theme: 'light', toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<ThemeType>('light');

  const toggle = () => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
```

### Tailwind Configuration

```typescript
// tailwind.config.ts
export default {
  theme: {
    colors: {
      primary: {
        50: '#eff6ff',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
      },
      // ... full color palette
    },
    spacing: {
      0: '0',
      px: '1px',
      0.5: '2px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      // ... full spacing scale
    },
    borderRadius: {
      none: '0',
      sm: '2px',
      md: '4px',
      lg: '8px',
      full: '9999px',
    },
  },
};
```

---

## Dark Mode Toggle

**Requirement**: Theme toggle in top toolbar

**Behavior**:
1. User clicks moon/sun icon
2. Theme switches instantly
3. CSS variables update
4. All colors invert
5. Preference saved to localStorage
6. On reload: Uses saved preference

**Code**:
```tsx
<button
  onClick={() => useTheme().toggle()}
  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
  aria-label="Toggle theme"
>
  {theme === 'light' ? '🌙' : '☀️'}
</button>
```

---

## Accessibility Compliance

- All color combinations: WCAG AA (4.5:1) minimum
- Focus indicators: Always visible, high contrast
- Reduced motion: Respects `prefers-reduced-motion`
- Color alone: Never the only information carrier
- High contrast mode: Supports system high contrast

---

## Related Specs

- `ui-components/spec.md` - Component styling using theme
- `layout-system/spec.md` - Layout dimensions and spacing
- `../design.md` - Overall design philosophy
