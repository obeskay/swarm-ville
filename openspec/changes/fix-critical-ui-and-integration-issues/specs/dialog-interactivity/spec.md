# Dialog Interactivity Capability

**Capability ID:** `dialog-interactivity`
**Domain:** User Interface
**Status:** Modified

## Overview

This capability ensures modal dialogs are fully interactive and receive pointer events even when rendered inside containers with `pointer-events: none`.

---

## ADDED Requirements

### REQ-DIALOG-001: Spawner Dialog Pointer Events

**Priority:** Critical
**Rationale:** Users must be able to create agents through the UI by interacting with form fields.

Modal dialogs must be interactive and receive pointer events even when rendered inside containers with `pointer-events: none`.

#### Scenario: User opens agent spawner dialog

**Given** the user is viewing a space
**When** they click the "+ Add Agent" button
**Then** the "Spawn New Agent" dialog appears
**And** the dialog overlay blocks clicks to the canvas behind it
**And** all input fields in the dialog accept keyboard input
**And** all buttons in the dialog respond to clicks

#### Scenario: User fills out agent spawner form

**Given** the "Spawn New Agent" dialog is open
**When** user clicks on "Agent Name" input field
**Then** the field gains focus and cursor appears
**And** typing adds text to the field
**When** user clicks on "Role" dropdown
**Then** dropdown menu opens with options
**When** user clicks "Spawn Agent" button
**Then** a new agent is created
**And** dialog closes

---

### REQ-DIALOG-002: Agent Chat Dialog Pointer Events

**Priority:** Critical
**Rationale:** Users must be able to send messages to agents through the chat interface.

The agent chat dialog must be fully interactive for messaging agents.

#### Scenario: User opens agent chat

**Given** at least one agent exists in the space
**When** the user clicks on an agent in the sidebar
**Then** the agent chat dialog appears on the right side
**And** the message input field accepts keyboard input
**And** the send button responds to clicks
**And** the close button (×) closes the dialog

#### Scenario: User sends message in agent chat

**Given** the agent chat dialog is open
**When** user clicks on the message input field
**Then** field gains focus and cursor appears
**When** user types "Hello, who are you?"
**And** user presses Enter key
**Then** message is sent to the agent
**And** message appears in chat history
**And** agent's response appears below user's message

---

### REQ-DIALOG-003: Z-Index Hierarchy

**Priority:** Medium
**Rationale:** Prevent z-index conflicts when multiple overlays are open simultaneously.

Multiple overlays must stack correctly when opened simultaneously.

#### Scenario: Multiple dialogs maintain correct stacking

**Given** the space UI is displayed
**When** multiple dialogs are opened
**Then** they stack in this order (top to bottom):

- Agent spawner: `z-index: 300`
- Agent chat: `z-index: 200`
- Space UI topbar: `z-index: 100`
- Agents sidebar: `z-index: 50`
- Canvas: `z-index: 1` (default)

#### Scenario: Closing top dialog reveals one beneath

**Given** both agent spawner and agent chat are open
**When** user closes the agent spawner dialog
**Then** the agent chat dialog is still visible
**And** both dialogs remain interactive throughout

---

## Implementation Notes

**Files to Modify:**

- `src/components/agents/AgentSpawner.css` - Add `pointer-events: auto` to `.spawner-overlay`
- `src/components/agents/AgentDialog.css` - Verify `pointer-events: auto` exists on `.agent-dialog-overlay`

**CSS Changes Required:**

```css
/* AgentSpawner.css - ADD THIS LINE */
.spawner-overlay {
  pointer-events: auto; /* ← ADD THIS */
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

/* AgentDialog.css - VERIFY THIS LINE EXISTS */
.agent-dialog-overlay {
  pointer-events: auto; /* ← Should already exist */
  position: fixed;
  /* ... */
}
```

**Parent Container Context:**
The `.space-ui` container has `pointer-events: none` to allow canvas clicks. Child dialogs must explicitly override this with `pointer-events: auto`.

**Z-Index Strategy:**

- Use increments of 50 for clear hierarchy
- Reserve 300+ for modal dialogs
- Reserve 100-200 for UI chrome (topbar, sidebar)
- Reserve 1-50 for content layers (canvas)

## Related Requirements

- Complements: REQ-CANVAS-001 (canvas must remain clickable when dialogs closed)
- Enables: Future UI improvements (settings dialog, help overlay)

## Acceptance Criteria

- [ ] User can click and type in "Agent Name" input field
- [ ] User can click and select from "Role" dropdown
- [ ] User can click and select from "AI Model" dropdown
- [ ] "Spawn Agent" button creates agent when clicked
- [ ] "Cancel" button closes dialog when clicked
- [ ] Clicking outside dialog (on dark overlay) closes dialog
- [ ] Agent chat message input accepts keyboard input
- [ ] Agent chat send button (→) works on click
- [ ] Agent chat close button (×) works on click
- [ ] No z-index conflicts between dialogs
- [ ] Canvas remains clickable when no dialogs are open
