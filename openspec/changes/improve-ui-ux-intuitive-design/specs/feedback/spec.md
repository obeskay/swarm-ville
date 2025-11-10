# Visual Feedback System

## ADDED Requirements

### Requirement: Toast Notifications for All Actions

The application MUST show toast notifications for all user actions and system events.

#### Scenario: Success action shows toast

**GIVEN** the user performs a successful action (e.g., creates an agent)
**WHEN** the action completes
**THEN** a success toast appears in the top-right with:
- Green checkmark icon
- Message: "Agent created successfully"
- Auto-dismiss after 4 seconds
**AND** the toast slides in from the right over 200ms
**AND** multiple toasts stack vertically with 8px gap

#### Scenario: Error action shows persistent toast

**GIVEN** an action fails (e.g., auto-save error)
**WHEN** the error occurs
**THEN** an error toast appears with:
- Red alert icon
- User-friendly message: "Failed to save. Please check your connection."
- "Retry" button
- "Dismiss" button
**AND** the toast does NOT auto-dismiss
**AND** clicking "Retry" attempts the action again
**AND** clicking "Dismiss" closes the toast

#### Scenario: Undo action in toast

**GIVEN** the user deletes an agent
**WHEN** the deletion completes
**THEN** a toast appears: "Agent deleted"
**AND** an "Undo" button is present
**AND** clicking "Undo" within 10 seconds restores the agent
**AND** the toast auto-dismisses after 10 seconds
**AND** if user clicks "Undo", a new toast shows "Agent restored"

### Requirement: Error Boundaries with Recovery

The application MUST wrap components in error boundaries that show friendly recovery options.

#### Scenario: Component error triggers boundary

**GIVEN** a React component throws an error (e.g., in Pixi.js rendering)
**WHEN** the error occurs
**THEN** the error boundary catches it
**AND** the affected component is replaced with an error state showing:
- Error icon
- Message: "Something went wrong rendering the canvas"
- "Reload Canvas" button
- "Report Bug" link
**AND** other parts of the app continue functioning
**AND** clicking "Reload Canvas" remounts the component
**AND** the error is logged to console (dev mode)

#### Scenario: Critical app error

**GIVEN** an unrecoverable error occurs (e.g., Zustand store corruption)
**WHEN** the error is thrown
**THEN** the root error boundary shows full-screen error state:
- Message: "Critical error occurred"
- "Reload Application" button
- Technical details in collapsible section
**AND** clicking "Reload Application" does `window.location.reload()`

### Requirement: Loading States with Skeletons

The application MUST show loading states for async operations using skeleton screens.

#### Scenario: Space loading shows skeleton

**GIVEN** the user switches to a space
**AND** the space data is loading from Tauri backend
**WHEN** the loading state is active
**THEN** the canvas area shows a skeleton with:
- Pulsing gray rectangles for grid tiles
- Animated shimmer effect
- Text: "Loading space..."
**AND** the skeleton matches the layout of the actual canvas
**AND** the transition from skeleton to real content is smooth (fade-in)

#### Scenario: Agent list loading

**GIVEN** the agent panel is visible
**AND** agent data is loading
**WHEN** the loading state is active
**THEN** 3 skeleton cards appear with:
- Circle placeholder for avatar
- Rectangle for name
- Rectangle for status
**AND** the skeletons have subtle pulse animation
**AND** real data replaces skeletons one-by-one as it loads

### Requirement: Empty States with CTAs

The application MUST replace generic "no data" messages with helpful empty states.

#### Scenario: No agents yet

**GIVEN** a space has zero agents
**WHEN** viewing the agent panel
**THEN** an empty state shows:
- Illustration or icon (robot icon)
- Headline: "No agents in this space"
- Subtext: "Agents help automate tasks and collaborate with you"
- Primary button: "Add Your First Agent"
- Secondary link: "Learn about agents"
**AND** clicking the primary button opens the agent spawner
**AND** the secondary link opens docs in new tab

#### Scenario: No spaces created

**GIVEN** the user has zero spaces
**WHEN** viewing the space switcher
**THEN** an empty state shows:
- Icon (plus in circle)
- Message: "Create your first collaborative space"
- Button: "New Space"
**AND** clicking the button creates a space with default settings

## MODIFIED Requirements

### Requirement: Replace console errors with user-facing toasts

All errors currently logged to console MUST be shown to users via toasts.

#### Scenario: Auto-save error migration

**GIVEN** the `useAutoSave` hook catches an error
**WHEN** the save fails
**THEN** instead of `console.error()`, a toast is shown:
- Icon: Warning triangle
- Message: "Auto-save failed. Changes may not be saved."
- Action: "Save Manually"
**AND** clicking "Save Manually" triggers immediate save attempt
**AND** the error is still logged to console (dev mode only)

## Implementation Notes

- Use existing `sonner` library for toasts
- Create `useToast()` hook wrapper:
```typescript
const { toast } = useToast();
toast.success("Message", { action: { label: "Undo", onClick: fn } });
toast.error("Message", { persist: true });
```
- Error boundaries at:
  - Root: `<App>`
  - SpaceContainer: `<SpaceContainer>`
  - Each sidebar panel
- Skeleton components in `src/components/ui/skeleton.tsx` (shadcn)
- Empty state components in `src/components/empty-states/`
- Animation library: CSS transitions + Framer Motion for complex sequences
