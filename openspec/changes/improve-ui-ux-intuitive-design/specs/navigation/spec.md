# Navigation & Discovery

## ADDED Requirements

### Requirement: Command Palette

The application MUST provide a command palette for quick navigation and actions.

#### Scenario: User opens command palette

**GIVEN** the user is on any screen
**WHEN** the user presses `Cmd/Ctrl+K`
**THEN** a modal command palette appears centered on screen
**AND** an input field is auto-focused with placeholder "Type a command..."
**AND** a list shows recent/suggested commands:
- "Create New Space"
- "Add Agent"
- "Toggle Theme"
- "Open Settings"
**AND** pressing `Esc` closes the palette

#### Scenario: User searches for command

**GIVEN** the command palette is open
**WHEN** the user types "agent"
**THEN** the list filters to matching commands:
- "Add Agent" (matches "agent")
- "View Agent List" (matches "agent")
**AND** the first result is highlighted
**AND** pressing `Enter` executes the highlighted command
**AND** pressing `↑/↓` navigates the list

#### Scenario: Command palette shows keyboard shortcuts

**GIVEN** the command palette is open
**WHEN** viewing the command list
**THEN** each command shows its keyboard shortcut on the right:
- "Add Agent" `A`
- "New Space" `N`
- "Settings" `,`
**AND** pressing the shortcut key directly executes the command (no Enter needed)

### Requirement: Universal Keyboard Shortcuts

The application MUST support keyboard shortcuts for all major actions.

#### Scenario: User presses shortcut

**GIVEN** the user is viewing a space
**WHEN** the user presses `A` key
**THEN** the "Add Agent" dialog opens
**AND** the first input field is focused

**WHEN** the user presses `N` key
**THEN** a new space is created
**AND** the user is navigated to the new space
**AND** a toast confirms: "New space created"

**WHEN** the user presses `?` key
**THEN** a keyboard shortcuts help modal opens showing all shortcuts

#### Scenario: Shortcuts don't interfere with input

**GIVEN** the user is typing in a text input field
**WHEN** the user presses `N` key
**THEN** the letter "n" is typed into the field
**AND** the "New Space" shortcut is NOT triggered
**AND** shortcuts only work when no input/textarea is focused

### Requirement: Contextual Help System

The application MUST provide contextual help for features.

#### Scenario: Help button shows contextual docs

**GIVEN** the user is on the Agents tab in right sidebar
**WHEN** the user clicks the help icon (?) in the tab header
**THEN** a popover appears with:
- Headline: "About Agents"
- Short explanation (2-3 sentences)
- Link: "Learn more in docs"
- Link: "Watch video tutorial"
**AND** clicking "Learn more" opens docs in new tab
**AND** clicking outside the popover closes it

#### Scenario: Keyboard shortcuts modal

**GIVEN** the user presses `?` key
**WHEN** the shortcuts modal opens
**THEN** shortcuts are grouped by category:
- **General**: `Cmd+K` (Command Palette), `Esc` (Close)
- **Navigation**: `Cmd+B` (Toggle Sidebar), `Tab` (Next field)
- **Actions**: `A` (Add Agent), `N` (New Space)
- **Help**: `?` (This menu), `Cmd+/` (Contextual help)
**AND** each shortcut is visually styled as a keyboard key
**AND** pressing `Esc` closes the modal

### Requirement: Breadcrumb Navigation

The application MUST show breadcrumbs for current location context.

#### Scenario: Breadcrumbs show navigation path

**GIVEN** the user is viewing "Office Space" with "Agent 3" selected
**WHEN** looking at the top toolbar
**THEN** breadcrumbs show: `SwarmVille › Office Space › Agent 3`
**AND** each segment is clickable
**AND** clicking "Office Space" deselects the agent
**AND** clicking "SwarmVille" returns to home/space list

#### Scenario: Breadcrumbs adapt to context

**GIVEN** no space is selected
**WHEN** viewing the home screen
**THEN** breadcrumbs show only: `SwarmVille › Home`

**GIVEN** a space is selected but no agent
**WHEN** viewing the canvas
**THEN** breadcrumbs show: `SwarmVille › [Space Name]`

## MODIFIED Requirements

### Requirement: Add tooltips to all existing buttons

All interactive elements without tooltips MUST receive them.

#### Scenario: Toolbar buttons have tooltips

**GIVEN** any button in the top toolbar (theme toggle, settings, etc.)
**WHEN** the user hovers for 500ms OR focuses via keyboard (Tab)
**THEN** a tooltip appears showing:
- Button name
- Keyboard shortcut (if any)
**AND** the tooltip positions above the button
**AND** the tooltip has a small arrow pointing to the button

## Implementation Notes

- Command palette: Use `cmdk` library (by Vercel)
- Keyboard shortcuts: Use `react-hotkeys-hook` for reliable handling
- Prevent shortcuts when input focused: `document.activeElement.tagName === 'INPUT'`
- Shortcuts config in `src/lib/keyboard-shortcuts.ts`:
```typescript
export const shortcuts = {
  ADD_AGENT: { key: 'a', description: 'Add Agent' },
  NEW_SPACE: { key: 'n', description: 'New Space' },
  // ...
};
```
- Breadcrumbs component: `src/components/navigation/Breadcrumbs.tsx`
- Help content stored in `src/lib/help/contextual-help.ts`
- Tooltip wrapper: Extend shadcn `<Tooltip>` with delay prop
