# Dynamic Configuration System Specification

## Overview

This specification defines a fully dynamic, zero-hardcoded configuration system for SwarmVille's minimalist UI. All values (colors, sizes, spacing, animations) are loaded from configuration files at runtime, enabling easy customization without code changes.

## Requirement: Configuration-Driven Architecture

**Description**: All UI values come from centralized configuration, not hardcoded in components.

**File Structure**:
```
config/
├── theme.config.ts           (Main theme configuration)
├── layout.config.ts          (Layout dimensions and breakpoints)
├── animations.config.ts      (Animation durations and easing)
└── ui.config.ts              (Component-specific settings)

src/
├── hooks/
│  ├── useThemeConfig.ts      (Hook to access theme)
│  ├── useLayoutConfig.ts     (Hook to access layout)
│  └── useUIConfig.ts         (Hook to access UI config)
└── utils/
   └── configLoader.ts        (Load and merge configs)
```

---

## Theme Configuration (`config/theme.config.ts`)

```typescript
export const themeConfig = {
  // Color palette - fully configurable
  colors: {
    primary: {
      base: '#3b82f6',
      hover: '#2563eb',
      active: '#1d4ed8',
      light: '#dbeafe',
      dark: '#1e40af',
    },
    secondary: {
      base: '#8b5cf6',
      hover: '#7c3aed',
      active: '#6d28d9',
      light: '#ede9fe',
      dark: '#5b21b6',
    },
    success: {
      base: '#10b981',
      hover: '#059669',
      active: '#047857',
      light: '#d1fae5',
      dark: '#065f46',
    },
    warning: {
      base: '#f59e0b',
      hover: '#d97706',
      active: '#b45309',
      light: '#fef3c7',
      dark: '#92400e',
    },
    error: {
      base: '#ef4444',
      hover: '#dc2626',
      active: '#b91c1c',
      light: '#fee2e2',
      dark: '#7f1d1d',
    },
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    surface: {
      light: '#ffffff',
      dark: '#1a1a2e',
    },
    text: {
      light: {
        primary: '#1f2937',
        secondary: '#374151',
        tertiary: '#6b7280',
        inverse: '#ffffff',
      },
      dark: {
        primary: '#f0f4f8',
        secondary: '#e0e7f1',
        tertiary: '#b8c5d6',
        inverse: '#1a1a2e',
      },
    },
  },

  // Typography - fully configurable
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"Menlo", "Monaco", "Courier New", monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '24px',
      '2xl': '32px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      loose: 1.75,
    },
  },

  // Spacing scale - 4px base unit
  spacing: {
    px: '1px',
    0.5: '2px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },

  // Border widths
  borderWidth: {
    0: '0',
    px: '1px',
    2: '2px',
    4: '4px',
  },

  // Shadows (solid only, no blur/transparency)
  // All "shadows" are borders or color changes instead
};
```

---

## Layout Configuration (`config/layout.config.ts`)

```typescript
export const layoutConfig = {
  // Responsive breakpoints
  breakpoints: {
    xs: 0,      // Mobile
    sm: 640,    // Tablet
    md: 1024,   // Desktop
    lg: 1280,   // Large
    xl: 1536,   // XL
  },

  // Toolbar dimensions
  toolbar: {
    desktop: {
      height: '56px',
      padding: '8px 16px',
      borderWidth: '1px',
    },
    tablet: {
      height: '48px',
      padding: '6px 12px',
      borderWidth: '1px',
    },
    mobile: {
      height: '44px',
      padding: '4px 8px',
      borderWidth: '1px',
    },
  },

  // Sidebar dimensions
  sidebar: {
    desktop: {
      width: '280px',
      maxHeight: '75vh',
      borderWidth: '1px',
    },
    tablet: {
      width: '240px',
      maxHeight: '75vh',
      borderWidth: '1px',
      collapsedWidth: '64px',
    },
    mobile: {
      width: '100%',
      maxWidth: 'calc(100vw - 60px)',
      borderWidth: '0',
      position: 'overlay',
    },
  },

  // Status bar dimensions
  statusBar: {
    desktop: {
      height: '32px',
      padding: '0 16px',
      borderWidth: '1px',
    },
    tablet: {
      height: '32px',
      padding: '0 12px',
      borderWidth: '1px',
    },
    mobile: {
      height: '28px',
      padding: '0 8px',
      borderWidth: '1px',
    },
  },

  // Component sizing
  components: {
    button: {
      desktop: {
        height: '40px',
        padding: '8px 16px',
        fontSize: '14px',
      },
      mobile: {
        height: '36px',
        padding: '6px 12px',
        fontSize: '13px',
      },
    },
    input: {
      height: '40px',
      padding: '8px 12px',
      fontSize: '14px',
    },
    card: {
      padding: '16px',
      borderRadius: '8px',
      borderWidth: '1px',
    },
  },
};
```

---

## Animation Configuration (`config/animations.config.ts`)

```typescript
export const animationConfig = {
  // Duration in milliseconds
  durations: {
    instant: 0,
    fast: 100,
    normal: 150,
    slow: 200,
    slower: 300,
    slowest: 500,
  },

  // Easing functions
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    cubic: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Animations for specific interactions
  animations: {
    // Button click feedback
    buttonPress: {
      duration: 'normal', // 150ms
      easing: 'easeInOut',
      transform: 'scale(0.95)',
    },

    // Hover effects
    hover: {
      duration: 'fast', // 100ms
      easing: 'easeInOut',
      properties: ['background-color', 'color'],
    },

    // Panel open/close
    panelSlide: {
      duration: 'normal', // 150ms
      easing: 'easeInOut',
      properties: ['transform', 'opacity'],
    },

    // Progress bar fill
    progressFill: {
      duration: 'slow', // 200ms
      easing: 'easeOut',
      properties: ['width', 'background-color'],
    },

    // Page transitions
    fadeIn: {
      duration: 'slow', // 200ms
      easing: 'easeIn',
      properties: ['opacity'],
    },
  },

  // Reduced motion support (accessibility)
  reducedMotion: {
    enabled: true,
    disableDuration: 0,
    disableEasing: 'linear',
  },
};
```

---

## UI Component Configuration (`config/ui.config.ts`)

```typescript
export const uiConfig = {
  // Mission display configuration
  missions: {
    maxVisible: 5,
    collapsedByDefault: false,
    showRewardBadge: true,
    progressBarHeight: '4px',
    cardMinHeight: '80px',
    animateProgress: true,
    animationDuration: 'slow', // From animation config
  },

  // Agent display configuration
  agents: {
    maxVisible: 10,
    showStatus: true,
    statusIndicatorSize: '4px',
    avatarSize: '32px',
    collapsedByDefault: false,
    showLastInteraction: true,
  },

  // Badge configuration
  badges: {
    size: 'sm', // xs, sm, md, lg
    shapes: {
      pill: true,
      rounded: true,
    },
    variants: {
      online: 'success',
      offline: 'neutral',
      completed: 'primary',
      warning: 'warning',
      error: 'error',
    },
  },

  // Dialog configuration
  dialogs: {
    backdrop: {
      color: '#1f2937',
      opacity: 0.6,
    },
    animation: {
      type: 'fadeIn',
      duration: 'normal',
    },
    closeButton: true,
    closeOnBackdropClick: true,
  },

  // Status indicators
  statusBar: {
    showConnection: true,
    showFPS: true,
    showAgentCount: true,
    showPosition: true,
    updateFrequency: 'every-frame',
  },
};
```

---

## Configuration Hooks

### `useThemeConfig()`

```typescript
// src/hooks/useThemeConfig.ts
import { useContext } from 'react';
import { ThemeConfigContext } from '../providers/ConfigProvider';

export function useThemeConfig() {
  const config = useContext(ThemeConfigContext);
  if (!config) {
    throw new Error('useThemeConfig must be used within ConfigProvider');
  }
  return config.theme;
}

// Usage in components:
function MyButton() {
  const theme = useThemeConfig();
  return (
    <button
      style={{
        backgroundColor: theme.colors.primary.base,
        padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
        borderRadius: theme.borderRadius.md,
      }}
    >
      Click me
    </button>
  );
}
```

### `useLayoutConfig()`

```typescript
// src/hooks/useLayoutConfig.ts
export function useLayoutConfig() {
  const config = useContext(ConfigContext);
  return config.layout;
}

// Usage:
function Sidebar() {
  const layout = useLayoutConfig();
  const isMobile = useMediaQuery(`(max-width: ${layout.breakpoints.sm}px)`);

  return (
    <aside style={{
      width: isMobile ? layout.sidebar.mobile.width : layout.sidebar.desktop.width,
    }}>
      {/* ... */}
    </aside>
  );
}
```

### `useAnimationConfig()`

```typescript
// src/hooks/useAnimationConfig.ts
export function useAnimationConfig() {
  const config = useContext(ConfigContext);
  return config.animations;
}

// Usage:
function Button() {
  const anim = useAnimationConfig();
  const prefersReducedMotion = usePrefersReducedMotion();

  const duration = prefersReducedMotion
    ? anim.reducedMotion.disableDuration
    : anim.durations[anim.animations.buttonPress.duration];

  return (
    <button style={{
      transition: `transform ${duration}ms ${anim.easing.easeInOut}`,
    }}>
      Click
    </button>
  );
}
```

---

## Configuration Provider

```typescript
// src/providers/ConfigProvider.tsx
import React, { createContext, useMemo } from 'react';
import { themeConfig } from '../config/theme.config';
import { layoutConfig } from '../config/layout.config';
import { animationConfig } from '../config/animations.config';
import { uiConfig } from '../config/ui.config';

export const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const config = useMemo(() => ({
    theme: themeConfig,
    layout: layoutConfig,
    animations: animationConfig,
    ui: uiConfig,
  }), []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}
```

---

## Configuration Loading & Merging

```typescript
// src/utils/configLoader.ts
export async function loadConfig() {
  // Load base config
  const baseConfig = {
    theme: themeConfig,
    layout: layoutConfig,
    animations: animationConfig,
    ui: uiConfig,
  };

  // Load custom/user config if exists
  try {
    const customConfig = await fetch('/config/custom.json').then(r => r.json());
    return deepMerge(baseConfig, customConfig);
  } catch {
    return baseConfig;
  }
}

// Deep merge utility
function deepMerge(base, custom) {
  return Object.keys(custom).reduce((acc, key) => {
    if (typeof custom[key] === 'object') {
      acc[key] = deepMerge(base[key] || {}, custom[key]);
    } else {
      acc[key] = custom[key];
    }
    return acc;
  }, { ...base });
}
```

---

## No Hardcoded Values Rule

**Requirement**: Enforce no hardcoded values in components

**Forbidden Patterns**:
```typescript
// ❌ WRONG - Hardcoded color
<button style={{ backgroundColor: '#3b82f6' }}>

// ❌ WRONG - Hardcoded size
<div style={{ width: '280px' }}>

// ❌ WRONG - Hardcoded spacing
<div style={{ padding: '16px' }}>
```

**Required Patterns**:
```typescript
// ✅ CORRECT - From config
const theme = useThemeConfig();
<button style={{ backgroundColor: theme.colors.primary.base }}>

// ✅ CORRECT - From layout config
const layout = useLayoutConfig();
<div style={{ width: layout.sidebar.desktop.width }}>

// ✅ CORRECT - From spacing
<div style={{ padding: theme.spacing[4] }}>
```

---

## Runtime Configuration Override

Allow users to override configuration at runtime:

```typescript
// src/utils/configOverride.ts
export function overrideConfig(partialConfig) {
  const stored = localStorage.getItem('swarmville-config');
  const current = stored ? JSON.parse(stored) : {};
  const merged = deepMerge(current, partialConfig);
  localStorage.setItem('swarmville-config', JSON.stringify(merged));
  window.location.reload(); // Reload to apply
}

// Usage:
overrideConfig({
  theme: {
    colors: {
      primary: { base: '#ff0000' }, // User override
    },
  },
});
```

---

## Benefits

✅ **Zero Hardcoding**: All values from configuration
✅ **Easy Customization**: Change values without touching code
✅ **Theme Switching**: Runtime theme changes without reload
✅ **User Preferences**: Save and load custom configs
✅ **Maintainability**: Single source of truth for all design values
✅ **Scalability**: Easy to add new configurations
✅ **Testing**: Mock configs for testing different scenarios

---

## Related Specs

- `../design.md` - Design philosophy
- `ui-components/spec.md` - Components using config
- `layout-system/spec.md` - Layout using config
- `theme-system/spec.md` - Theme using config
