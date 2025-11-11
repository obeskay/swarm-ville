# Minimalist UI Redesign - Architecture & Design

## Design Philosophy

**"Content first, chrome last"** - Every pixel should serve a purpose. No decorative elements, no invasive overlays, maximum clarity.

## Key Principles

1. **Solidity**: Solid colors, clear borders, no transparency
2. **Clarity**: High contrast, readable typography, obvious affordances
3. **Density**: Compact layouts without wasted space
4. **Responsiveness**: Content adapts to user needs and screen size
5. **Dynamics**: Smooth animations and transitions provide feedback

## Visual Design System - FULLY CONFIGURABLE

**Key Principle**: All colors, sizes, and spacing are configurable via `config/theme.config.ts`. No hardcoded values in components.

### Color Palette Configuration

Colors defined in `config/theme.config.ts`:

```typescript
// Colors loaded from config, not hardcoded
export const colors = {
  primary: { base: "#3b82f6", hover: "#2563eb", light: "#dbeafe", dark: "#1e40af" },
  secondary: { base: "#8b5cf6", hover: "#7c3aed", light: "#ede9fe", dark: "#5b21b6" },
  success: { base: "#10b981", hover: "#059669", light: "#d1fae5", dark: "#065f46" },
  warning: { base: "#f59e0b", hover: "#d97706", light: "#fef3c7", dark: "#92400e" },
  error: { base: "#ef4444", hover: "#dc2626", light: "#fee2e2", dark: "#7f1d1d" },
  neutral: { base: "#6b7280", light: "#f3f4f6", dark: "#1f2937" },
  // ... all colors from config
};

// Usage in components:
const buttonColor = useThemeConfig().colors.primary.base;
```

**Rationale**:

- Easy theme switching without code changes
- Colors loaded at runtime from configuration
- Supports dynamic theming (user preferences)
- No string literals in components

### Typography

```
Headings:   "System Font", sans-serif, 600-700 weight
Body:       "System Font", sans-serif, 400-500 weight
Monospace:  "Menlo", monospace for code/values
Sizes:      h1=32px, h2=24px, h3=18px, body=14px, small=12px
Line-height: 1.5 for body, 1.3 for headings
```

### Spacing System

```
xs: 2px (borders, dividers)
sm: 4px (component padding)
md: 8px (interior spacing)
lg: 16px (section spacing)
xl: 24px (layout spacing)
2xl: 32px (major gaps)
```

## Layout Architecture

### Canvas-First Design

```
┌─────────────────────────────────────────┐
│  Toolbar: Minimalfunction buttons, theme│
├─────────────┬───────────────┬───────────┤
│             │               │           │
│  Left       │  Game Canvas  │  Right    │
│  Sidebar    │  (Primary)    │  Sidebar  │
│  (Missions) │               │  (Agents) │
│             │               │           │
├─────────────┴───────────────┴───────────┤
│ Status Bar: Position, FPS, Online status│
└─────────────────────────────────────────┘
```

### Sidebar Behavior

**Left Sidebar (Missions)**:

- Always visible on desktop
- Collapses to icon bar on mobile
- Sections collapse individually
- Current mission highlighted

**Right Sidebar (Agents)**:

- Can be toggled off (maximize game canvas)
- Minimal when closed (just icon badge)
- Expands to show agent list
- Quick action buttons for spawning

### Responsive Breakpoints

```
Mobile (<640px):      Single column, overlays for panels
Tablet (640-1024px):  Two column, collapsible sidebars
Desktop (>1024px):    Three column, full layout
```

## Component Design Patterns

### Button Styles

```
Primary:    Solid blue background, white text, no shadow
Secondary:  Gray border, gray text, no fill
Tertiary:   Text only, no border, gray text
Icon:       32x32px, click-sensitive area
Compact:    Small padding, 12px height, for lists
```

### Panel Styles

```
Card:       White/dark background, 1px border, 8px radius
Header:     8px padding, 14px bold text, bottom divider
Content:    16px padding, 14px normal text
Footer:     8px padding, gray text, top divider, action buttons
```

### Mission Display

```
Active Section:
├─ Icon (32px)
├─ Title (14px bold)
├─ Description (12px gray)
├─ Progress bar (4px height, colored)
└─ Reward badges

Collapsed Section:
└─ Just icon with badge count
```

### Agent Display

```
Agent Card:
├─ Avatar (32x32px)
├─ Name (14px bold)
├─ Status badge (online/offline)
├─ Quick actions (message, remove)
└─ Optional: Last interaction

Empty State:
└─ Icon + "No agents" + "Add Agent" button
```

## Animation Guidelines

### Transitions

```
Properties:  opacity, transform, background-color
Duration:    200ms for UI interactions
Easing:      ease-in-out for smoothness
Debounce:    50ms to prevent jank
```

### Interactions

1. **Button Press**: Scale 0.95, 100ms
2. **Hover**: Background color shift, 150ms
3. **Panel Open/Close**: Slide + fade, 200ms
4. **Mission Progress**: Color gradient animation, 300ms
5. **Agent Spawn**: Pop-in effect, 200ms

## State Management Integration

```
useGameStore:
  ├─ selectedMission → highlights in UI
  ├─ gameState → updates status indicators
  └─ userPosition → shows on status bar

useSpaceStore:
  ├─ agents → renders agent list
  ├─ spaces → for space selection
  └─ spaceConfig → layout settings

useUserStore:
  ├─ achievements → mission display
  ├─ playerStats → HUD elements
  └─ preferences → theme/layout
```

## Accessibility Requirements

- WCAG 2.1 Level AA compliance
- Minimum 4.5:1 contrast ratio for text
- Focus indicators for keyboard navigation
- ARIA labels for icon-only buttons
- Semantic HTML structure
- Color not the only information carrier

## Performance Optimizations

1. **Component Memoization**: useMemo for computed values
2. **Lazy Loading**: Sidebars load only when visible
3. **Virtual Scrolling**: Agent list if >50 agents
4. **CSS-in-JS**: Tailwind for zero-runtime overhead
5. **Asset Optimization**: SVG icons instead of PNGs

## Migration Path

### Phase 1: Design System

- Create new component primitives
- Define theme configuration
- Test with one section

### Phase 2: Sidebar Redesign

- Rebuild left sidebar (missions)
- Rebuild right sidebar (agents)
- Update layout container

### Phase 3: Polish & Testing

- Animations and interactions
- Responsive behavior
- Accessibility audit
- Performance profiling

### Phase 4: Finalization

- Documentation
- Component storybook
- User testing
- Deploy to production

## File Structure

```
src/
├─ components/
│  ├─ layout/
│  │  ├─ MinimalLayout.tsx (new)
│  │  ├─ TopToolbar.tsx (redesign)
│  │  ├─ LeftSidebar.tsx (redesign)
│  │  ├─ RightSidebar.tsx (redesign)
│  │  └─ BottomStatusBar.tsx (redesign)
│  ├─ ui/
│  │  ├─ minimal-button.tsx (new)
│  │  ├─ minimal-card.tsx (new)
│  │  ├─ minimal-panel.tsx (new)
│  │  └─ minimal-badge.tsx (new)
│  └─ missions/
│     └─ MissionSection.tsx (redesign)
├─ styles/
│  ├─ minimal-theme.css (new)
│  ├─ colors.ts (new)
│  └─ spacing.ts (new)
└─ hooks/
   └─ useMinimalUI.ts (new)
```

## Testing Strategy

1. **Visual Regression**: Screenshot tests for all sections
2. **Responsiveness**: Test at 3 breakpoints
3. **Accessibility**: axe-core for WCAG compliance
4. **Performance**: Lighthouse for Core Web Vitals
5. **Functional**: All features still work as designed

## Success Metrics

- No transparency in main UI: 100%
- Component coverage: 100%
- Accessibility score: ≥95
- Performance (Lighthouse): ≥90
- User satisfaction: Positive feedback
