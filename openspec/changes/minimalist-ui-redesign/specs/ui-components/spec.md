# UI Components Specification

## Overview

This specification defines the minimalist component system for SwarmVille. All components use solid colors, clear affordances, and zero transparency.

## Components

### Button Component

#### Requirement: Primary Button Style
**Description**: Clickable button with solid background, used for primary actions.

**Implementation**:
```tsx
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:scale-95 transition-all">
  Action
</button>
```

**Visual**:
- Background: Solid #3b82f6 (blue)
- Text: White, 14px, 500 weight
- Padding: 8px 16px
- Border radius: 4px
- Hover: Darken to #2563eb
- Active: Scale 0.95
- Transition: 150ms ease-in-out

**Scenarios**:
1. User clicks "Create Agent" → Button feedback immediate, action triggers
2. User hovers over button → Color shifts, cursor changes
3. User holds mouse down → Button scales down slightly
4. Keyboard focus → Visible focus ring (2px blue outline)

---

#### Requirement: Secondary Button Style
**Description**: Button for secondary actions, uses border instead of fill.

**Implementation**:
```tsx
<button className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
  Secondary
</button>
```

**Visual**:
- Border: 1px solid #d1d5db (gray)
- Text: #374151 (dark gray), 14px, 500 weight
- Background: Transparent
- Hover: #f9fafb (light gray)
- Padding: 8px 16px
- Border radius: 4px

**Scenarios**:
1. User clicks secondary action → Subtle background change
2. User cancels dialog → Dismisses without action
3. Mobile view → Full-width secondary button

---

#### Requirement: Icon Button Style
**Description**: Square button containing only an icon, used for toolbar actions.

**Implementation**:
```tsx
<button className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded transition-colors">
  <Icon size={24} />
</button>
```

**Visual**:
- Size: 40x40px (click target)
- Icon: 24x24px, centered
- Background: Transparent, hover #f3f4f6
- Border radius: 4px
- No text, tooltip on hover

**Scenarios**:
1. User clicks theme toggle → Theme switches instantly
2. User clicks mission collapse → Section folds/unfolds
3. User hovers → Tooltip appears after 500ms
4. Keyboard focus → Clear focus ring visible

---

### Card Component

#### Requirement: Standard Card
**Description**: Container for grouped content with clear boundaries.

**Implementation**:
```tsx
<div className="bg-white border border-gray-200 rounded-lg p-4">
  <h3 className="font-semibold text-lg mb-2">Title</h3>
  <p className="text-gray-700">Content</p>
</div>
```

**Visual**:
- Background: White (#ffffff) or #1a1a2e (dark)
- Border: 1px solid #e5e7eb or #374151
- Border radius: 8px
- Padding: 16px
- Box shadow: None (zero transparency)
- Gap between cards: 16px

**Scenarios**:
1. Mission card displays → Clear border separates from background
2. Multiple cards in list → Even spacing, aligned
3. Dark mode → Border and background adjust
4. Empty state → Card shows placeholder text

---

#### Requirement: Mission Card
**Description**: Displays single mission with progress and rewards.

**Visual Structure**:
```
┌─────────────────────────────┐
│ 🚶 First Steps       1/5     │
├─────────────────────────────┤
│ Move around your space...   │
│ ████░░░░░░░░ 20% progress │
│ Reward: +100 XP             │
└─────────────────────────────┘
```

**Components**:
- Icon (32px) + Title (bold) + Progress counter
- Description (12px, gray)
- Progress bar (4px, colored by status)
- Reward badge (small pill with icon)

**Scenarios**:
1. Mission 1/5 complete → Progress shows 20%, bar fills
2. User completes mission → Bar fills completely, button appears
3. Active mission → Highlighted with blue left border (4px)
4. Collapsed view → Shows only icon + counter badge

---

### Badge Component

#### Requirement: Status Badge
**Description**: Small indicator for status (online, offline, completed, etc).

**Implementation**:
```tsx
<span className="inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
  Online
</span>
```

**Variants**:
- Online: Green (#10b981)
- Offline: Gray (#6b7280)
- Completed: Blue (#3b82f6)
- In Progress: Amber (#f59e0b)
- Error: Red (#ef4444)

**Visual**:
- Background: Light tint of color (10% opacity solid fill, not transparent)
- Text: Darker shade of color (70% opacity)
- Padding: 4px 8px
- Border radius: 16px (pill shape)
- Font: 12px, 500 weight

**Scenarios**:
1. Agent comes online → Badge changes green instantly
2. Agent disconnects → Badge turns gray
3. Mission completes → Badge turns blue
4. Error occurs → Badge turns red with alert icon

---

### Input Component

#### Requirement: Text Input
**Description**: Single-line text field for user input.

**Implementation**:
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
  placeholder="Enter text..."
/>
```

**Visual**:
- Border: 1px solid #d1d5db
- Focus: Blue border + ring (2px solid ring, NOT transparent)
- Padding: 8px 12px
- Border radius: 4px
- Font: 14px
- Placeholder: Gray #9ca3af

**Scenarios**:
1. User focuses input → Blue ring appears
2. User types → Text appears immediately
3. Validation error → Red border, error message below
4. Disabled state → Gray background, no interaction

---

### Panel Component

#### Requirement: Collapsible Section
**Description**: Panel header that can collapse/expand content.

**Structure**:
```
┌─────────────────────────────┐
│ ▼ Section Title         [5] │ ← Header
├─────────────────────────────┤
│ Content area                │
│ - Item 1                    │
│ - Item 2                    │
│                             │
└─────────────────────────────┘
```

**Interactions**:
- Click header to toggle collapse
- Arrow rotates 180° when collapsed
- Badge shows count (e.g., "5 items")
- Smooth slide animation (200ms)

**Visual**:
- Header: 8px padding, 14px bold text, bottom divider
- Content: 16px padding, slide animation
- Arrow: 16x16px, rotates on collapse
- Badge: Small blue circle with number

**Scenarios**:
1. User clicks header → Content slides down smoothly
2. Content already expanded → Arrow points down
3. Multiple sections → Each toggles independently
4. Mobile view → Sections collapse by default

---

### Divider Component

#### Requirement: Visual Separator
**Description**: Clear line separating sections.

**Implementation**:
```tsx
<div className="h-px bg-gray-200 dark:bg-gray-700 my-4"></div>
```

**Visual**:
- Height: 1px
- Color: #e5e7eb (light) or #374151 (dark)
- Margin: 16px vertical
- Full width of container

**Scenarios**:
1. Between panel sections → Clear visual separation
2. Dark mode → Uses darker gray
3. In cards → Divides header from content
4. Between list items → Subtle separation

---

## Accessibility Requirements

### Color Contrast
- All text: Minimum 4.5:1 contrast ratio
- Focus indicators: Always visible, minimum 2px
- Status indicators: Not color-alone (use text + color)

### Keyboard Navigation
- All buttons: Tab-focusable, clickable with Enter
- Modals: Tab loops within modal, Escape closes
- Sections: Arrow keys to navigate (optional)

### Screen Readers
- Buttons: Semantic `<button>` tags with ARIA labels
- Icons: Title attributes or ARIA descriptions
- Badges: Announce status (e.g., "Agent is online")
- Sections: Use `aria-expanded` for collapse state

### Focus Management
- Visual focus ring: 2px solid blue outline
- Focus order: Logical top-to-bottom flow
- Skip links: Jump to main content (if needed)

---

## Implementation Notes

- All components built with Tailwind CSS v4
- Use React functional components with TypeScript
- Memoize components to prevent unnecessary re-renders
- Test all components with axe-core for accessibility
- Provide Storybook stories for each component

---

## Related Specs

- `layout-system/spec.md` - How components are arranged
- `theme-system/spec.md` - Color and spacing system
- `../design.md` - Overall design philosophy
