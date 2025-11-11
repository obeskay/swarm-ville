# Layout System Specification

## Overview

This specification defines the responsive layout system for SwarmVille, optimizing the game canvas as the primary focus with minimal UI chrome.

## Layout Structure

### Desktop Layout (>1024px)

```
┌────────────────────────────────────────┐
│  Top Toolbar (56px)                    │
├────────┬──────────────────┬────────────┤
│ Left   │   Game Canvas    │ Right      │
│ 280px  │   (Primary)      │ 280px      │
│        │                  │            │
│ 75% of │                  │            │
│ height │                  │ 75% of     │
│        │                  │ height     │
├────────┴──────────────────┴────────────┤
│  Status Bar (32px)                     │
└────────────────────────────────────────┘
```

**Dimensions**:
- Top toolbar: 56px height
- Left sidebar: 280px width, 75% viewport height
- Right sidebar: 280px width, 75% viewport height
- Game canvas: Remaining width and height
- Status bar: 32px height

**Layout Code**:
```tsx
<div className="flex flex-col h-screen bg-gray-50">
  <TopToolbar />
  <div className="flex flex-1">
    <LeftSidebar className="w-70 border-r" />
    <GameContainer className="flex-1" />
    <RightSidebar className="w-70 border-l" />
  </div>
  <BottomStatusBar />
</div>
```

---

### Tablet Layout (640px - 1024px)

```
┌────────────────────────────────┐
│  Top Toolbar (48px)            │
├────────┬───────────────────────┤
│ Side   │   Game Canvas         │
│ Panel  │   (Primary)           │
│ 240px  │                       │
│ toggle │                       │
│        │                       │
├────────┴───────────────────────┤
│  Status Bar (32px)             │
└────────────────────────────────┘
```

**Key Changes**:
- Single sidebar visible at a time (toggle available)
- Sidebar width: 240px
- Toolbar height: 48px
- Game canvas takes full remaining space
- Status bar same 32px height

**Toggle Behavior**:
- Icon button in toolbar to toggle sidebar
- Left sidebar = Missions, Right sidebar = Agents
- Currently visible sidebar shown, other hidden
- Smooth slide animation (200ms) when toggling

---

### Mobile Layout (<640px)

```
┌──────────────────────────┐
│  Mini Toolbar (44px)     │
├──────────────────────────┤
│   Game Canvas            │
│   (Full Width/Height)    │
│                          │
│                          │
├──────────────────────────┤
│  Status Bar (28px)       │
│  + Floating Panel Toggle │
└──────────────────────────┘
```

**Key Changes**:
- Game canvas: Full width and height
- Toolbar buttons: Minimal, icon-only (32x32px)
- Status bar: Compressed (28px)
- Sidebars: Floating overlays triggered by button
- Safe area aware (notches, home indicators)

**Floating Sidebars**:
- Missions: Slide in from left
- Agents: Slide in from right
- Semi-transparent backdrop (solid, not transparent)
- Dismissible by: clicking backdrop, swiping, or button

---

## Requirement: Top Toolbar

**Description**: Primary navigation and quick actions.

**Desktop (56px)**:
```
┌────────────────────────────────────────┐
│ Logo  Theme  +Space  Settings   Help   │
└────────────────────────────────────────┘
```

**Components**:
- Logo + Title (left align)
- Theme toggle button (icon)
- Create space button
- Settings button
- Help button

**Visual**:
- Background: #ffffff (light) or #1a1a2e (dark)
- Border bottom: 1px solid #e5e7eb
- Padding: 8px 16px
- Height: 56px (40px buttons + 8px padding)

**Scenarios**:
1. User clicks theme toggle → Theme switches, toolbar updates
2. User clicks create space → Dialog appears (centered)
3. User clicks settings → Settings panel opens
4. Mobile view → Buttons become icon-only, spacing tighter

**Mobile Adjustments**:
- Height: 44px
- Spacing: 4px instead of 8px
- Icons: 28x28px instead of 32x32px
- Hidden: Logo, title
- Added: Menu button (hamburger)

---

## Requirement: Left Sidebar (Missions)

**Description**: Displays active missions and progress tracking.

**Structure**:
```
┌──────────────────────┐
│ Active Missions   ⌄ │  Header
├──────────────────────┤
│ 🚶 First Steps       │
│ [████░░░░░] 50%      │
│ +100 XP              │
├──────────────────────┤
│ 🤖 Create Agent      │
│ [██░░░░░░░░] 10%     │
│ +250 XP              │
├──────────────────────┤
│ 💬 Talk to Agent     │
│ [░░░░░░░░░░] 0%      │
│ +200 XP              │
└──────────────────────┘
```

**Desktop**:
- Width: 280px
- Height: 75% of viewport (excluding toolbar/status)
- Background: White / #1a1a2e
- Border right: 1px solid #e5e7eb
- Padding: 0 (full height)
- Overflow: Scrollable

**Sections**:
1. **Header**: "Active Missions" with collapse arrow
   - Height: 48px
   - Padding: 12px 16px
   - Font: 16px, 600 weight
   - Border bottom: 1px divider

2. **Mission Cards**: Individual progress cards
   - Padding: 12px 16px (within card)
   - Card margin: 8px 8px (around edges)
   - Height: Auto, minimum 80px
   - Expanded view: Shows full description
   - Collapsed view: Icon + title only

3. **Progress Bar**: Visual progress indicator
   - Height: 4px
   - Width: Full card width minus padding
   - Color: Blue (#3b82f6) for active
   - Color: Green (#10b981) for completed
   - Color: Gray (#9ca3af) for locked
   - Background: Light gray #e5e7eb

4. **Reward Badge**: Shows XP reward
   - Icon: Star or trophy (16px)
   - Text: "+100 XP"
   - Font: 12px, 500 weight
   - Padding: 4px 8px
   - Background: Light blue (#dbeafe)
   - Text color: Dark blue (#1e40af)

**Collapse Behavior** (Tablet):
- Collapses to icon bar (64px width)
- Icon: F (for First Steps), A (for Agent), etc.
- Badge shows number (e.g., "2" = 2 active missions)
- Click icon to expand to full sidebar

**Mobile**:
- Width: Full viewport
- Height: Auto, scrollable
- Appears as overlay on top of game canvas
- Backdrop: Solid dark gray with 60% opacity (#1f2937)
- Slide animation: 200ms from left
- Can be dismissed by swiping left or clicking backdrop

---

## Requirement: Right Sidebar (Agents)

**Description**: Agent management and quick actions.

**Structure**:
```
┌──────────────────────┐
│ Agents            ⌄ │  Header with count
├──────────────────────┤
│ Claude           ●   │  Online indicator
│ [Message]        [×] │
├──────────────────────┤
│ Gemini           ●   │
│ [Message]        [×] │
├──────────────────────┤
│ [+ Add Agent]        │
└──────────────────────┘
```

**Desktop**:
- Width: 280px
- Height: 75% of viewport
- Background: White / #1a1a2e
- Border left: 1px solid #e5e7eb
- Padding: 0
- Overflow: Scrollable

**Sections**:
1. **Header**: "Agents" with agent count badge
   - Height: 48px
   - Padding: 12px 16px
   - Shows: "Agents" + count circle
   - Example: "Agents  2"

2. **Agent List**: Individual agent items
   - Padding: 12px 16px
   - Height: 56px
   - Layout: Avatar + name + status + actions
   - Hover: Light background change

3. **Agent Item Components**:
   - Avatar: 32x32px, rounded, placeholder if no image
   - Name: 14px, 500 weight, left-align
   - Status: Green dot (4px) for online, gray for offline
   - Actions: Message button, remove button (icons)
   - Last interaction: Optional 12px gray text

4. **Add Agent Button**:
   - Full width (minus padding)
   - Primary style (blue background)
   - Icon + "Add Agent" text
   - 40px height
   - Margin: 8px 8px
   - Click opens AgentSpawner dialog

**Empty State**:
```
┌──────────────────────┐
│ Agents            ⌄ │
├──────────────────────┤
│        [👤]          │
│    No agents yet     │
│                      │
│ [+ Add Agent]        │
└──────────────────────┘
```

**Collapse Behavior** (Tablet):
- Icon bar with agent count badge
- Shows total agents as circle badge
- Click icon to expand

**Mobile**:
- Overlays from right side
- Backdrop: Solid dark gray
- Slide animation: 200ms
- Full width minus small margin (left 60px for swiping back)

---

## Requirement: Bottom Status Bar

**Description**: Real-time game status and metrics.

**Structure**:
```
┌────────────────────────────────────┐
│ ONLINE  30 FPS  0 agents  11,5     │
└────────────────────────────────────┘
```

**Desktop (32px)**:
- Background: White / #1a1a2e
- Border top: 1px solid #e5e7eb
- Padding: 0 16px
- Display: Inline flex with gaps

**Sections**:
1. **Connection Status**:
   - Dot indicator (4px) + "ONLINE" or "OFFLINE"
   - Color: Green (#10b981) for online
   - Color: Red (#ef4444) for offline
   - Updates instantly on connection change

2. **Performance Metrics**:
   - FPS counter: "30 FPS" (or current FPS)
   - Updated every frame
   - Color: Green >50fps, Yellow 30-50fps, Red <30fps
   - Font: 12px monospace

3. **Agent Count**:
   - "0 agents" or "2 agents"
   - Updated when agents spawn/despawn
   - Font: 12px

4. **Player Position**:
   - "11,5" (grid coordinates)
   - Updated as player moves
   - Font: 12px monospace
   - Right-aligned

**Mobile (28px)**:
- Tighter padding: 0 8px
- Smaller fonts: 11px
- Abbreviated: "30FPS" instead of "30 FPS"
- Positions: Left, center, right (top row), bottom row if needed

**State Indicators**:
- Online: Green circle + "ONLINE"
- Offline: Red circle + "OFFLINE"
- Reconnecting: Yellow circle + "RECONNECTING"
- Error: Red circle + "ERROR"

---

## Responsive Behavior

### Breakpoints

```typescript
export const breakpoints = {
  xs: 0,      // Mobile
  sm: 640,    // Tablet
  md: 1024,   // Desktop
  lg: 1280,   // Large Desktop
  xl: 1536,   // XL Desktop
};
```

### CSS Media Queries

```css
/* Mobile */
@media (max-width: 639px) {
  .sidebar { display: none; }
  .toolbar-height { height: 44px; }
  .status-height { height: 28px; }
}

/* Tablet */
@media (min-width: 640px) and (max-width: 1023px) {
  .sidebar { width: 240px; }
  .toolbar-height { height: 48px; }
}

/* Desktop */
@media (min-width: 1024px) {
  .sidebar { width: 280px; }
  .toolbar-height { height: 56px; }
}
```

---

## Accessibility Requirements

- Focus management: Tab order follows visual left-to-right
- Skip links: Jump to game canvas from toolbar
- Keyboard navigation: All buttons accessible via Tab + Enter/Space
- Screen readers: Semantic structure, proper ARIA roles
- Resize: Layout works at 200% zoom

---

## Implementation Notes

- Built with Tailwind CSS responsive utilities
- Flexbox for layout (not CSS Grid)
- Mobile-first CSS (styles for mobile, then override for larger)
- Use CSS variables for dynamic dimensions
- Test all breakpoints with Chrome DevTools

---

## Related Specs

- `ui-components/spec.md` - Component styling
- `theme-system/spec.md` - Colors and spacing
- `../design.md` - Design philosophy
