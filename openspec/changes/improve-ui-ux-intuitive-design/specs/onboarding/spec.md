# Onboarding System

## ADDED Requirements

### Requirement: Contextual Tooltip System

The application MUST provide contextual tooltips that guide new users through key features without blocking the interface.

#### Scenario: First-time user creates space

**GIVEN** a user opens the application for the first time
**AND** `hasCompletedOnboarding` is `false`
**WHEN** the app loads
**THEN** a tooltip appears near the "New Space" button with text "Start here! Create your first collaborative space"
**AND** the tooltip has a pulsing indicator
**AND** clicking outside the tooltip does NOT dismiss it
**AND** clicking the button advances to the next tooltip

#### Scenario: User hovers over unlabeled button

**GIVEN** any interactive element in the UI
**WHEN** the user hovers for 500ms
**THEN** a tooltip appears showing:
- Button name
- Keyboard shortcut (if applicable)
- Brief description (1 sentence)
**AND** the tooltip dismisses when hover ends

### Requirement: Optional Guided Tour

The application MUST provide an optional guided tour using spotlight/highlight technique.

#### Scenario: User starts guided tour

**GIVEN** the user is on any screen
**WHEN** the user clicks "Start Tour" in the help menu OR presses `?` key
**THEN** a spotlight highlights the first tour step
**AND** a modal overlay dims the rest of the UI
**AND** the highlighted element has a pulsing border
**AND** navigation buttons show "Next", "Back", "Skip Tour"
**AND** tour progress indicator shows "Step 1 of 7"

#### Scenario: User skips tour midway

**GIVEN** the guided tour is active on step 3 of 7
**WHEN** the user clicks "Skip Tour"
**THEN** a confirmation dialog appears: "Exit tour? You can restart anytime from the help menu"
**AND** clicking "Exit" closes the tour and restores normal UI
**AND** clicking "Continue" returns to the tour
**AND** tour progress is saved (can resume later)

### Requirement: Integration with Active Missions

The onboarding system MUST integrate with the existing "Active Missions" panel for progressive learning.

#### Scenario: User completes onboarding milestone

**GIVEN** the user has active mission "Create Your First Agent"
**WHEN** the user successfully spawns an agent
**THEN** the mission updates to show "1/1" completion
**AND** a toast notification appears: "Mission complete! +250 XP"
**AND** the missions panel highlights the next uncompleted mission
**AND** if this was the last mission, `hasCompletedOnboarding` is set to `true`

#### Scenario: User reopens app after partial completion

**GIVEN** the user completed 2 of 5 onboarding missions
**AND** the user closed and reopened the app
**WHEN** the app loads
**THEN** the missions panel shows progress "2/5"
**AND** tooltips for completed missions do NOT appear
**AND** the next uncompleted mission's tooltip is highlighted

## MODIFIED Requirements

### Requirement: Remove blocking onboarding wizard

The full-screen onboarding wizard MUST be replaced with the contextual system.

#### Scenario: Existing OnboardingWizard component

**GIVEN** the `OnboardingWizard.tsx` component exists
**WHEN** refactoring to new system
**THEN** the component is deprecated with a feature flag `ENABLE_NEW_ONBOARDING`
**AND** old wizard only shows if flag is `false`
**AND** after migration, the component is removed

## Implementation Notes

- Use `react-joyride` library for guided tour (v2.5+)
- Store tour progress in `userStore.tourProgress: { step: number; completed: string[] }`
- Tooltips use shadcn `<Tooltip>` component with custom styles
- Tooltip delay: 500ms hover, instant on keyboard focus
- Tour steps defined in `src/lib/onboarding/tourSteps.ts`
- Missions data in `src/lib/onboarding/missions.ts`
